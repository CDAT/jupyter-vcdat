import { ISettingRegistry } from "@jupyterlab/settingregistry";
import { boundMethod } from "autobind-decorator";

export class AppSettings {
  private settings: ISettingRegistry.ISettings;
  constructor(appSettings: ISettingRegistry.ISettings) {
    this.settings = appSettings;
  }

  @boundMethod
  public getId(): string {
    return this.settings.id;
  }

  @boundMethod
  public getVersion(): string {
    return this.settings.version;
  }

  @boundMethod
  public getSavedPaths(): string[] {
    try {
      return this.settings.get("savedPaths").composite as string[];
    } catch (error) {
      console.error(error);
      return Array<string>();
    }
  }

  @boundMethod
  public async setSavedPaths(options: string[]): Promise<void> {
    try {
      await this.settings.set("savedPaths", options);
    } catch (error) {
      console.error(error);
    }
  }
}
