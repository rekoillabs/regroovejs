import fs from "fs";
import path from "path";
const isBrowser = typeof window !== 'undefined';
let InferenceSession, Tensor
if (isBrowser) {
  ({ InferenceSession, Tensor } = require("onnxruntime-web"))
} else {
  ({ InferenceSession, Tensor } = require("onnxruntime"))
}

import { zeroArray } from "./util";
import { Pattern } from "./pattern";
import { stringify } from "querystring";

interface ModelMeta {
  name: string;
  path: string;
  absPath: string;
  latentSize: number;
  channels: number;
  loopDuration: number;
}

function loadMeta(modelDir: string, name: string): ModelMeta {
  const data = fs.readFileSync(path.join(modelDir, `${name}.json`), "utf-8");
  return JSON.parse(data);
}

class ModelType {
  _name: string;
  private readonly _models: Record<string, ModelMeta>;
  _modelDir: string;
  private readonly _meta: ModelMeta;

  constructor(name: string, modelDir: string) {
    this._name = name;
    this._models = {};
    this._modelDir = modelDir;

    this._models.syncopate = loadMeta(modelDir, "syncopate");
    this._models.groove = loadMeta(modelDir, "groove");

    this._models.syncopate.absPath = path.resolve(this.modelDir, this._models.syncopate.path);
    this._models.groove.absPath = path.resolve(this.modelDir, this._models.groove.path);

    this._meta = this._models[this._name];
    if (this._meta === undefined) {
      console.error(`Invalid model name: ${this._name}`);
      throw new Error();
    }
  }

  get name(): string {
    return this._name;
  }

  set name(value: string) {
    this._name = value;
  }

  get modelDir(): string {
    return this._modelDir;
  }

  set modelDir(value: string) {
    this._modelDir = value;
  }

  get meta(): ModelMeta {
    return this._meta;
  }
}

class ONNXModel {
  /**
   * Wraps ONNX model for stateful inference sessions
   */
  session: typeof InferenceSession;
  meta: ModelMeta;
  deltaZ: number[];

  constructor(session: typeof InferenceSession, meta: ModelMeta) {
    if (typeof session === "undefined") {
      console.error(
        "cannot be called directly - use await Model.build(pattern) instead"
      );
      throw new Error();
    }
    this.session = session;
    this.meta = meta;
    this.deltaZ = zeroArray(meta.latentSize);
  }

  static async load(modelName: string, modelDir: string): Promise<ONNXModel> {
    /**
     * @filePath Path to ONNX model
     */
    const modelMeta = new ModelType(modelName, modelDir).meta;
    try {
      const session = await InferenceSession.create(modelMeta.absPath);
      return new ONNXModel(session, modelMeta);
    } catch (e) {
      console.error(
        `failed to load ONNX model from ${modelMeta.path}: ${stringify(e)}`
      );
      throw new Error();
    }
  }

  async forward(
    input: Pattern,
    noteDropout = 0.5
  ): Promise<Record<string, typeof Tensor>> {
    /**
     * Forward pass of ONNX model.
     *
     * @input       Pattern instance containing input data
     * @noteDropout Probability of note dropout when generating new pattern
     *
     * @returns output indices
     */
    const feeds = {
      input: input,
      delta_z: new Tensor("float32", this.deltaZ, [this.deltaZ.length]),
      note_dropout: new Tensor("float32", [noteDropout], [1]),
    };
    const output = await this.session.run(feeds);
    return output;
  }
}

export { ONNXModel };
