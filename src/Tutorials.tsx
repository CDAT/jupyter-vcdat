import * as React from "react";
import reactJoyride, { CallBackProps } from "react-joyride";
import Modal from "reactstrap/lib/Modal";
import ModalHeader from "reactstrap/lib/ModalHeader";
import ModalBody from "reactstrap/lib/ModalBody";
import ModalFooter from "reactstrap/lib/ModalFooter";
import { HoverBox } from "@jupyterlab/apputils";

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
    title: "Welcome to vCDAT 2.0!",
    target: "#main",
    content: `This is a bunch of tutorial text.
    This is a bunch of tutorial text.
    This is a bunch of tutorial text. This is a bunch of tutorial text.
    This is a bunch of tutorial text.`,
    textAlign: "left",
    placement: "center"
  },
  {
    offset: 0,
    event: "hover",
    title: "VCDAT 2.0",
    target: ".jp-icon-vcdat",
    content: `This is the vcdat extension icon. 
    Click it to open and close the vcdat side menu.`,
    textAlign: "right",
    placement: "right"
  },
  {
    target: ".vcsmenu-plot-btn-vcdat",
    content: "This is the plot button!",
    textAlign: "center",
    placement: "bottom"
  },
  {
    target: ".vcsmenu-export-btn-vcdat",
    content: "This is the export plot button!",
    textAlign: "center",
    placement: "bottom"
  },
  {
    target: ".vcsmenu-clear-btn-vcdat",
    content: "This is the clear plot button!",
    textAlign: "center",
    placement: "bottom"
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
  public joyrideRef: Joyride;
  constructor(props: IJoyrideTutorialProps) {
    super(props);
    this.state = {
      run: this.props.runOnStart,
      steps: WELCOME_TUTORIAL,
      modalOpen: this.props.runOnStart
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
        <Joyride
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
