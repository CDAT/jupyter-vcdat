import * as React from "react";
// tslint:disable-next-line
import ReactJoyride, { CallBackProps } from "react-joyride";

const defaultOptions = {
  arrowColor: "#fff",
  backgroundColor: "#fff",
  beaconSize: 36,
  overlayColor: "rgba(0, 0, 0, 0.5)",
  primaryColor: "#f04",
  spotlightShadow: "0 0 15px rgba(0, 0, 0, 0.5)",
  textColor: "#333",
  zIndex: 100
};

export type TUTORIAL_NAMES =
  | "default"
  | "main"
  | "topMenu"
  | "varMenu"
  | "graphicsMenu"
  | "templatesMenu"
  | "notebook";

const WELCOME_TUTORIAL = [
  {
    content: `This is a bunch of tutorial text.
    This is a bunch of tutorial text.
    This is a bunch of tutorial text. This is a bunch of tutorial text.
    This is a bunch of tutorial text.`,
    placement: "center",
    target: "#main",
    textAlign: "left",
    title: "Welcome to vCDAT 2.0!"
  },
  {
    content: `This is the vcdat extension icon. 
    Click it to open and close the vcdat side menu.`,
    event: "hover",
    offset: 0,
    placement: "right",
    target: ".jp-icon-vcdat",
    textAlign: "right",
    title: "VCDAT 2.0"
  },
  {
    content: "This is the plot button!",
    placement: "bottom",
    target: ".vcsmenu-plot-btn-vcdat",
    textAlign: "center"
  },
  {
    content: "This is the export plot button!",
    placement: "bottom",
    target: ".vcsmenu-export-btn-vcdat",
    textAlign: "center"
  },
  {
    content: "This is the clear plot button!",

    placement: "bottom",
    target: ".vcsmenu-clear-btn-vcdat",
    textAlign: "center"
  }
];

interface IJoyrideTutorialProps {
  runOnStart: boolean;
}

interface IJoyrideTutorialState {
  run: boolean;
  steps: any;
  modalOpen: boolean;
}

export default class JoyrideTutorial extends React.Component<
  IJoyrideTutorialProps,
  IJoyrideTutorialState
> {
  public joyrideRef: ReactJoyride;
  constructor(props: IJoyrideTutorialProps) {
    super(props);
    this.state = {
      modalOpen: this.props.runOnStart,
      run: this.props.runOnStart,
      steps: WELCOME_TUTORIAL
    };
    this.handleJoyrideEvents = this.handleJoyrideEvents.bind(this);
    this.startTutorial = this.startTutorial.bind(this);

    this.joyrideRef = (React as any).createRef();
  }

  public startTutorial(tutorial: TUTORIAL_NAMES): void {
    let steps: any;
    switch (tutorial) {
      case "main":
        steps = WELCOME_TUTORIAL;
        break;
      default:
        steps = WELCOME_TUTORIAL;
    }
    this.setState({ steps, run: true });
    addEventListener("click", this.isVCDATIcon, {
      passive: true
    });
  }

  public async handleJoyrideEvents(event: CallBackProps): Promise<void> {
    if (!event) {
      return;
    }
    switch (event.type) {
      case "step:after":
        if (event.action !== "close") {
          return;
        }
      case "tour:end":
        await this.setState({ run: false });
        return;
      case "error:target_not_found":
        console.error(`Joyride element missing on step ${event.index}`);
    }
  }

  public render(): JSX.Element {
    return (
      <div>
        <ReactJoyride
          run={this.state.run}
          steps={this.state.steps}
          callback={this.handleJoyrideEvents}
          ref={loader => (this.joyrideRef = loader)}
          showSkipButton={true}
          showProgress={true}
          continuous={true}
          spotlightClicks={false}
          scrollToFirstStep={false}
          locale={{
            back: "Back",
            close: "Close",
            last: "Finish",
            next: "Next",
            skip: "Skip"
          }}
        />
      </div>
    );
  }

  private isVCDATIcon(event: MouseEvent) {
    if (event.target instanceof HTMLElement) {
      console.log(event.target);
      if (event.target.classList.contains("jp-icon-vcdat")) {
        console.log("Yay!");
        removeEventListener("click", this.isVCDATIcon);
      }
    }
  }
}
