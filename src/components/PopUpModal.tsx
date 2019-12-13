// Dependencies
import * as React from "react";
import { Button, Modal, ModalBody, ModalFooter, ModalHeader } from "reactstrap";
import { boundMethod } from "autobind-decorator";

interface IPopUpProps {
  message: string;
  btnText: string;
  title: string;
}

interface IPopUpState {
  modalOpen: boolean; // Whether a modal is currently open
}

export default class PopUpModal extends React.Component<
  IPopUpProps,
  IPopUpState
> {
  constructor(props: IPopUpProps) {
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
      <Modal isOpen={this.state.modalOpen} toggle={this.toggle} size="lg">
        <ModalHeader>{this.props.title}</ModalHeader>
        <ModalBody className={/*@tag<popup-modal>*/ "popup-modal-vcdat"}>
          {this.props.message}
        </ModalBody>
        <ModalFooter>
          <Button
            className={/*@tag<popup-modal-btn>*/ "popup-modal-btn-vcdat"}
            outline={true}
            color="primary"
            onClick={this.hide}
          >
            {this.props.btnText}
          </Button>
        </ModalFooter>
      </Modal>
    );
  }
}
