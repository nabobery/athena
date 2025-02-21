import { CNNConfig, CodeGenerator } from "../../types/CNNTypes";
import { KerasGenerator } from "./generators/keras";
import { PyTorchGenerator } from "./generators/pytorch";

export class CNNGenerator {
  private generators: Map<string, CodeGenerator>;

  constructor() {
    this.generators = new Map<string, CodeGenerator>([
      ["pytorch", new PyTorchGenerator()],
      ["keras", new KerasGenerator()],
    ]);
  }

  generateCode(framework: string, config: CNNConfig): string {
    const generator = this.generators.get(framework.toLowerCase());
    if (!generator) {
      throw new Error(`Unsupported framework: ${framework}`);
    }

    return `${generator.generateImports()}

${generator.generateModel(config)}

${generator.generateTrainingCode(config)}`;
  }
}
