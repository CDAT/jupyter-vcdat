import { ISettingRegistry } from "@jupyterlab/coreutils";

export class AppSettings {
  private settings: ISettingRegistry.ISettings;
  constructor(appSettings: ISettingRegistry.ISettings) {
    this.settings = appSettings;
  }

  get id(): string {
    return this.settings.id;
  }

  get version(): string {
    return this.settings.version;
  }

  public getSavedPaths(): string[] {
    try {
      return this.settings.get("savedPaths").composite as string[];
    } catch (error) {
      console.error(error);
      return Array<string>();
    }
  }

  public async setSavedPaths(options: string[]): Promise<void> {
    try {
      await this.settings.set("savedPaths", options);
    } catch (error) {
      console.error(error);
    }
  }
}
