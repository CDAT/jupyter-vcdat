/* eslint-disable no-underscore-dangle */
import {
  ITutorial,
  ITutorialManager,
  TutorialDefault,
  TutorialManager,
} from "jupyterlab-tutorial";
import { GETTING_STARTED } from "./constants";

/**
 * This class is meant to provide a simplified interface for the extension
 * to interact with the tutorial manager.
 */
export default class TutorialControl {
  private static _instance: TutorialControl;
  private static _initialized: boolean;
  private _tutorialManager: TutorialManager;

  /** Provide handle to the TutorialControl instance. */
  static getInstance(): TutorialControl {
    // Return the full instance only if it's initialized
    if (TutorialControl._initialized) {
      return TutorialControl._instance;
    }
    throw Error(
      `${TutorialControl.name} is not initialized. Must initialize first.`
    );
  }

  public static async initialize(
    tutorialManager: TutorialManager
  ): Promise<TutorialControl> {
    // Create singleton instance
    const control = new TutorialControl();
    TutorialControl._initialized = false;
    TutorialControl._instance = control;
    control._tutorialManager = tutorialManager;

    // Create a jupyterlab intro tutorial
    const jupyterlabIntro: ITutorial = tutorialManager.createTutorial(
      "jp_intro",
      "Jupyterlab Tutorial: Intro",
      true
    );
    jupyterlabIntro.steps = TutorialDefault.steps;

    const vcdatIntro: ITutorial = tutorialManager.createTutorial(
      "vcdat_intro",
      `VCDAT Tutorial: Introduction`,
      true
    );
    vcdatIntro.steps = GETTING_STARTED;
    vcdatIntro.options.styles.backgroundColor = "#fcffff";
    vcdatIntro.options.styles.primaryColor = "#084f44";

    TutorialControl._initialized = true;
    return control;
  }
}
