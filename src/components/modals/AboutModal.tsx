// Dependencies
import React, { useState } from "react";
import {
  Button,
  Col,
  Modal,
  ModalBody,
  ModalFooter,
  ModalHeader,
  Row,
} from "reactstrap";

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

export default function AboutVCDAT(props: IAboutProps): JSX.Element {
  const [open, setOpen] = useState(false);

  const show = (): void => {
    setOpen(true);
  };

  const hide = (): void => {
    setOpen(false);
  };

  const toggle = (): void => {
    setOpen(!open);
  };

  return (
    <Modal style={{ ...modalStyling }} isOpen={open} toggle={toggle} size="lg">
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
                    {props.version}
                  </span>
                </h4>
              </Col>
            </Row>
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
              onClick={hide}
            >
              Dismiss
            </Button>
          </Col>
        </Row>
      </ModalFooter>
    </Modal>
  );
}
