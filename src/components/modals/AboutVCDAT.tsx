// Dependencies
import * as React from "react";
import {
  Button,
  Col,
  Modal,
  ModalBody,
  ModalFooter,
  ModalHeader,
  Row,
} from "reactstrap";
import { boundMethod } from "autobind-decorator";
import { connect } from "react-redux";
import { IState } from "../../modules/redux/types";
import { setDisplayMode } from "../../modules/redux/actions";
import { DISPLAY_MODE } from "../../modules/constants";

interface IAboutProps {
  version: string;
  notebookID: string;
}

interface IAboutState {
  modalOpen: boolean; // Whether a modal is currently open
}

const modalStyling: React.CSSProperties = {
  left: "50%",
  position: "fixed",
  textAlign: "left",
  top: "50%",
  transform: "translate(-50%, -50%)",
  verticalAlign: "middle",
  width: "400px",
};

const copyrightStyling: React.CSSProperties = {
  bottom: 0,
  fontSize: "0.8rem",
  fontWeight: "bold",
  left: 0,
  margin: 0,
  position: "absolute",
};

const iconStyling: React.CSSProperties = {
  backgroundImage: `url(${require("../../../style/icons/cdat_icon_colored.png")})`,
  backgroundSize: "100px",
  height: "100px",
  width: "100px",
};

const YEAR: number = new Date().getFullYear();
class AboutVCDATComp extends React.Component<IAboutProps, IAboutState> {
  constructor(props: IAboutProps) {
    super(props);
    this.state = {
      modalOpen: false,
    };
  }

  @boundMethod
  public async show(): Promise<void> {
    this.setState({ modalOpen: true });
  }

  @boundMethod
  public async hide(): Promise<void> {
    this.onTestClick(DISPLAY_MODE.Notebook);
    this.setState({ modalOpen: false });
  }

  @boundMethod
  public onTestClick(mode: DISPLAY_MODE): void {
    console.log(this.props.notebookID);
  }

  @boundMethod
  public async toggle(): Promise<void> {
    this.setState({ modalOpen: !this.state.modalOpen });
  }

  public render(): JSX.Element {
    return (
      <Modal
        style={{ ...modalStyling }}
        isOpen={this.state.modalOpen}
        toggle={this.toggle}
        size="lg"
      >
        <ModalHeader
          className={/* @tag<about-modal-header>*/ "about-modal-header-vcdat"}
        >
          <Row>
            <Col>
              <div style={{ ...iconStyling }} />
            </Col>
            <Col xs="auto">
              <Row>
                <Col>
                  <h1 className="text-primary">VCDAT</h1>
                </Col>
              </Row>
              <Row>
                <Col>
                  <h4 className="text-info">
                    Version{" "}
                    <span
                      className={/* @tag<about-version>*/ "about-version-vcdat"}
                    >
                      {this.props.version}
                    </span>
                  </h4>
                </Col>
              </Row>
              <Row>{this.props.notebookID}</Row>
            </Col>
          </Row>
        </ModalHeader>
        <ModalBody
          className={/* @tag<about-modal-body>*/ "about-modal-body-vcdat"}
        >
          <Row>
            <Col>
              <a
                className={
                  /* @tag<text-muted about-contributors>*/ "text-muted about-contributors-vcdat"
                }
                target="_blank"
                rel="noopener noreferrer"
                href="https://github.com/CDAT/jupyter-vcdat/graphs/contributors"
              >
                Contributors
              </a>
            </Col>
            <Col style={{ textAlign: "right" }}>
              <a
                className={
                  /* @tag<text-muted about-documentation>*/ "text-muted about-documentation-vcdat"
                }
                target="_blank"
                rel="noopener noreferrer"
                href="https://github.com/CDAT/jupyter-vcdat/wiki"
              >
                Documentation
              </a>
            </Col>
          </Row>
        </ModalBody>
        <ModalFooter
          className={/* @tag<about-modal-footer>*/ "about-modal-footer-vcdat"}
        >
          <Row style={{ width: "100%", margin: 0 }}>
            <Col>
              <p style={copyrightStyling}>&#169;{YEAR} LLNL CDAT TEAM</p>
            </Col>
            <Col style={{ padding: 0 }}>
              <Button
                className={
                  /* @tag<float-right about-modal-btn>*/ "float-right about-modal-btn-vcdat"
                }
                outline={true}
                color="primary"
                onClick={this.hide}
              >
                Dismiss
              </Button>
            </Col>
          </Row>
        </ModalFooter>
      </Modal>
    );
  }
}

const mapStateToProps = (state: IState, ownProps: IAboutProps): IAboutProps => {
  return {
    notebookID: state.displayMode.toString(),
    version: ownProps.version,
  };
};

const mapDispatchToProps = (dispatch: any) => {
  return {
    onTestClick: (mode: DISPLAY_MODE) => {
      dispatch(setDisplayMode(mode));
    },
  };
};

const AboutVCDAT = connect(mapStateToProps, mapDispatchToProps)(AboutVCDATComp);
export default AboutVCDATComp;
