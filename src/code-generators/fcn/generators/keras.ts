import {
  CodeGenerator,
  FCNConfig,
  FCNLayerTypes,
} from "../../../types/FCNTypes";

export class KerasGenerator implements CodeGenerator {
  /**
   * Generates the necessary import statements for a Keras model.
   * @returns A string containing the import statements
   */
  generateImports(): string {
    return `import keras
from keras import layers`;
  }

  /**
   * Generates a Keras model based on the given FCN configuration and model type.
   * @param config The FCN configuration
   * @param modelType The type of Keras model to generate, defaults to 'sequential'
   * @returns The generated code as a string
   */
  generateModel(config: FCNConfig): string {
    const modelType = config.kerasType || "Sequential";
    switch (modelType) {
      case "Functional":
        return this.generateFunctionalModel(config);
      case "Subclassing":
        return this.generateSubclassingModel(config);
      case "Sequential":
      default:
        return this.generateSequentialModel(config);
    }
  }

  /**
   * Generates a Keras Sequential model based on the given FCN configuration.
   * @param config The FCN configuration
   * @returns The generated code as a string
   */
  private generateSequentialModel(config: FCNConfig): string {
    let code = "model = keras.Sequential()\n";

    config.layers.forEach((layer) => {
      switch (layer.type) {
        case FCNLayerTypes.Input:
          code += `model.add(layers.Input(shape=(${layer.size},)))\n`;
          break;
        case FCNLayerTypes.Dense:
          code += `model.add(layers.Dense(${
            layer.size
          }, activation='${layer.activation.toLowerCase()}'))\n`;
          break;
        case FCNLayerTypes.Dropout:
          code += `model.add(layers.Dropout(${layer.rate}))\n`;
          break;
        case FCNLayerTypes.Output:
          code += `model.add(layers.Dense(${
            layer.size
          }, activation='${layer.activation.toLowerCase()}'))\n`;
          break;
      }
    });

    return code;
  }

  /**
   * Generates a Keras functional model based on the given FCN configuration.
   * @param config The FCN configuration
   * @returns The generated code as a string
   */
  private generateFunctionalModel(config: FCNConfig): string {
    let code = "";
    let prevLayer = "inputs";

    config.layers.forEach((layer) => {
      switch (layer.type) {
        case FCNLayerTypes.Input:
          code += `inputs = layers.Input(shape=(${layer.size},))\n`;
          break;
        case FCNLayerTypes.Dense:
          code += `x = layers.Dense(${
            layer.size
          }, activation='${layer.activation.toLowerCase()}')(${prevLayer})\n`;
          prevLayer = `x`;
          break;
        case FCNLayerTypes.Dropout:
          code += `x = layers.Dropout(${layer.rate})(${prevLayer})\n`;
          prevLayer = `x`;
          break;
        case FCNLayerTypes.Output:
          code += `x = layers.Dense(${
            layer.size
          }, activation='${layer.activation.toLowerCase()}')(${prevLayer})\n`;
          prevLayer = `x`;
          break;
      }
    });

    code += `\nmodel = keras.Model(inputs=inputs, outputs=${prevLayer})\n`;
    return code;
  }

  /**
   * Generates a Keras subclassing model based on the given FCN configuration.
   * @param config The FCN configuration
   * @returns The generated code as a string
   */
  private generateSubclassingModel(config: FCNConfig): string {
    let code = "class FCNModel(keras.Model):\n";
    code += "    def __init__(self):\n";
    code += "        super().__init__()\n";

    config.layers.forEach((layer, index) => {
      switch (layer.type) {
        case FCNLayerTypes.Dense:
          code += `        self.dense${index} = layers.Dense(${
            layer.size
          }, activation='${layer.activation.toLowerCase()}')\n`;
          break;
        case FCNLayerTypes.Dropout:
          code += `        self.dropout${index} = layers.Dropout(${layer.rate})\n`;
          break;
        case FCNLayerTypes.Output:
          code += `        self.dense${index} = layers.Dense(${
            layer.size
          }, activation='${layer.activation.toLowerCase()}')\n`;
          break;
      }
    });

    code += "\n    def call(self, inputs):\n";
    code += "        x = inputs\n";
    config.layers.forEach((layer, index) => {
      switch (layer.type) {
        case FCNLayerTypes.Dense:
          code += `        x = self.dense${index}(x)\n`;
          break;
        case FCNLayerTypes.Dropout:
          code += `        x = self.dropout${index}(x)\n`;
          break;
        case FCNLayerTypes.Output:
          code += `        x = self.dense${index}(x)\n`;
          break;
      }
    });
    code += "        return x\n";

    return code;
  }

  /**
   * Generates a function to train a given Keras model using the given FCN configuration.
   * @param config The FCN configuration
   * @returns The generated code as a string
   */
  generateTrainingCode(config: FCNConfig): string {
    return `
def train_model(model, x_train, y_train, epochs=10, batch_size=32):
    history = model.fit(
        x_train,
        y_train,
        epochs=epochs,
        batch_size=batch_size,
        validation_split=0.2
    )
    return history
\n# Example usage:
# Assume x_train and y_train are defined with proper input shapes and labels
${
  config?.kerasType == "Subclassing"
    ? "# For Subclassing model, we need to create a subclass model first => model = FCNModel()\n"
    : ""
}# train_model(model, x_train, y_train)`;
  }
}
