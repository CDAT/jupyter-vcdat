// Dependencies
import * as React from "react";
import {
  Button,
  Col,
  Modal,
  ModalBody,
  ModalFooter,
  ModalHeader,
  Row
} from "reactstrap";
import { boundMethod } from "autobind-decorator";

interface IAboutProps {
  version: string;
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
  width: "400px"
};

const copyrightStyling: React.CSSProperties = {
  bottom: 0,
  fontSize: "0.8rem",
  fontWeight: "bold",
  left: 0,
  margin: 0,
  position: "absolute"
};

const iconStyling: React.CSSProperties = {
  backgroundImage: `url(${require("../../style/icons/cdat_icon_colored.png")})`,
  backgroundSize: "100px",
  height: "100px",
  width: "100px"
};

const YEAR: number = new Date().getFullYear();

export default class AboutVCDAT extends React.Component<
  IAboutProps,
  IAboutState
> {
  constructor(props: IAboutProps) {
    super(props);
    this.state = {
      modalOpen: false
    };
  }

  @boundMethod
  public async show(): Promise<void> {
    await this.setState({ modalOpen: true });
  }

  @boundMethod
  public async hide(): Promise<void> {
    await this.setState({ modalOpen: false });
  }

  @boundMethod
  public async toggle(): Promise<void> {
    await this.setState({ modalOpen: !this.state.modalOpen });
  }

  public render(): JSX.Element {
    return (
      <Modal
        id={/*@tag<about-modal>*/ "about-modal-vcdat"}
        style={{ ...modalStyling }}
        isOpen={this.state.modalOpen}
        toggle={this.toggle}
        size="lg"
      >
        <ModalHeader>
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
                    <span id={/*@tag<about-version>*/ "about-version-vcdat"}>
                      {this.props.version}
                    </span>
                  </h4>
                </Col>
              </Row>
            </Col>
          </Row>
        </ModalHeader>
        <ModalBody
          className={/*@tag<about-modal-body>*/ "about-modal-body-vcdat"}
        >
          <Row>
            <Col>
              <a
                id={/*@tag<about-contributors>*/ "about-contributors-vcdat"}
                className="text-muted"
                target="_blank"
                href="https://github.com/CDAT/jupyter-vcdat/graphs/contributors"
              >
                Contributors
              </a>
            </Col>
            <Col style={{ textAlign: "right" }}>
              <a
                id={/*@tag<about-documentation>*/ "about-documentation-vcdat"}
                className="text-muted"
                target="_blank"
                href="https://github.com/CDAT/jupyter-vcdat/wiki"
              >
                Documentation
              </a>
            </Col>
          </Row>
        </ModalBody>
        <ModalFooter>
          <Row style={{ width: "100%", margin: 0 }}>
            <Col>
              <p style={copyrightStyling}>&#169;{YEAR} LLNL CDAT TEAM</p>
            </Col>
            <Col style={{ padding: 0 }}>
              <Button
                className={
                  /*@tag<float-right about-modal-btn>*/ "float-right about-modal-btn-vcdat"
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
