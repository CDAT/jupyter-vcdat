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

interface IAboutProps {
  version: string;
}

interface IAboutState {
  modalOpen: boolean; // Whether a modal is currently open
}

const styling: React.CSSProperties = {
  left: "50%",
  position: "fixed",
  textAlign: "left",
  top: "50%",
  transform: "translate(-50%, -50%)",
  verticalAlign: "middle",
  width: "400px"
};

const iconStyling: React.CSSProperties = {
  backgroundSize: "100px",
  height: "100px",
  width: "100px"
};

export default class AboutVCDAT extends React.Component<
  IAboutProps,
  IAboutState
> {
  constructor(props: IAboutProps) {
    super(props);
    this.state = {
      modalOpen: false
    };
    this.show = this.show.bind(this);
    this.hide = this.hide.bind(this);
    this.toggle = this.toggle.bind(this);
  }

  public async show(): Promise<void> {
    await this.setState({ modalOpen: true });
  }

  public async hide(): Promise<void> {
    await this.setState({ modalOpen: false });
  }

  public async toggle(): Promise<void> {
    await this.setState({ modalOpen: !this.state.modalOpen });
  }

  public render(): JSX.Element {
    return (
      <Modal
        style={{ ...styling }}
        isOpen={this.state.modalOpen}
        toggle={this.toggle}
        size="lg"
      >
        <ModalHeader>
          <Row>
            <Col>
              <div className="jp-icon-vcdat" style={{ ...iconStyling }} />
            </Col>
            <Col>
              <Row>
                <Col>
                  <h1>VCDAT</h1>
                </Col>
              </Row>
              <Row>
                <Col>
                  <h4>Version {this.props.version}</h4>
                </Col>
              </Row>
            </Col>
          </Row>
        </ModalHeader>
        <ModalBody
          className={/*@tag<about-vcdat-modal>*/ "about-vcdat-modal-vcdat"}
        >
          <Row>
            <Col>
              <a
                target="_blank"
                href="https://github.com/CDAT/jupyter-vcdat/graphs/contributors"
              >
                Contributors
              </a>
            </Col>
            <Col style={{ textAlign: "right" }}>
              <a
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
              <p
                style={{
                  bottom: 0,
                  fontSize: "0.8rem",
                  fontWeight: "bold",
                  left: 0,
                  margin: 0,
                  position: "absolute"
                }}
              >
                &#169;2019 LLNL CDAT TEAM
              </p>
            </Col>
            <Col style={{ padding: 0 }}>
              <Button
                className={
                  /*@tag<about-modal-btn>*/ "float-right about-modal-btn-vcdat"
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
