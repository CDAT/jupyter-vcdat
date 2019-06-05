import * as React from "react";
// tslint:disable-next-line
import ReactJoyride, { CallBackProps, STATUS } from "react-joyride";

export type TUTORIALS =
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
    placement: "right",
    target: ".jp-icon-vcdat",
    textAlign: "right",
    title: "VCDAT 2.0"
  }
];

const TOP_MENU_TUTORIAL = [
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
  currentTutorial: TUTORIALS;
  run: boolean;
  steps: any;
}

export default class JoyrideTutorial extends React.Component<
  IJoyrideTutorialProps,
  IJoyrideTutorialState
> {
  public joyrideRef: ReactJoyride;
  constructor(props: IJoyrideTutorialProps) {
    super(props);
    this.state = {
      currentTutorial: "main",
      run: false,
      steps: WELCOME_TUTORIAL
    };
    this.handleJoyrideEvents = this.handleJoyrideEvents.bind(this);
    this.startTutorial = this.startTutorial.bind(this);
    this.componentDidMount = this.componentDidMount.bind(this);
  }

  public componentDidMount(): void {
    this.joyrideRef = (React as any).createRef();
    if (this.props.runOnStart) {
      this.startTutorial("main");
    }
  }

  public async startTutorial(tutorial: TUTORIALS): Promise<void> {
    let tutorialSteps: any;
    switch (tutorial) {
      case "main":
        tutorialSteps = WELCOME_TUTORIAL;
        break;
      case "topMenu":
        tutorialSteps = TOP_MENU_TUTORIAL;
        break;
      default:
        tutorialSteps = WELCOME_TUTORIAL;
    }
    await this.setState({
      currentTutorial: tutorial,
      run: true,
      steps: tutorialSteps
    });
    this.joyrideRef.render();
  }

  public async handleJoyrideEvents(data: CallBackProps): Promise<void> {
    if (!data) {
      return;
    }
    const { status, type } = data;

    if (status === STATUS.FINISHED || status === STATUS.SKIPPED) {
      this.setState({ run: false });
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
}
