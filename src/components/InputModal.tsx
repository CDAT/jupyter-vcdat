// Dependencies
import * as React from "react";
import {
  Button,
  Input,
  InputGroup,
  Modal,
  ModalBody,
  ModalFooter,
  ModalHeader
} from "reactstrap";

interface IPopUpProps {
  message: string;
  acceptText: string;
  cancelText: string;
  placeHolder: string;
  title: string;
  onModalClose: (input: string) => void;
}

interface IPopUpState {
  modalOpen: boolean; // Whether a modal is currently open
  input: string; // The current string input in the modal
}

export default class PopUpModal extends React.Component<
  IPopUpProps,
  IPopUpState
> {
  constructor(props: IPopUpProps) {
    super(props);
    this.state = {
      input: "",
      modalOpen: false
    };
    this.show = this.show.bind(this);
    this.hide = this.hide.bind(this);
    this.toggle = this.toggle.bind(this);
    this.onInputUpdate = this.onInputUpdate.bind(this);
  }

  public async show(): Promise<void> {
    await this.setState({ modalOpen: true });
  }

  public async hide(): Promise<void> {
    this.props.onModalClose(this.state.input);
    await this.setState({ modalOpen: false, input: "" });
  }

  public async toggle(): Promise<void> {
    await this.setState({ modalOpen: !this.state.modalOpen });
  }

  public async onInputUpdate(
    event: React.ChangeEvent<HTMLInputElement>
  ): Promise<void> {
    await this.setState({ input: event.target.value });
  }

  public render(): JSX.Element {
    return (
      <Modal isOpen={this.state.modalOpen} toggle={this.toggle} size="lg">
        <ModalHeader>{this.props.title}</ModalHeader>
        <ModalBody
          className={/*@tag<popup-input-modal>*/ "popup-input-modal-vcdat"}
        >
          {this.props.message}
          <InputGroup>
            <Input
              id={/*@tag<input-modal-input>*/ "input-modal-input-vcdat"}
              onChange={this.onInputUpdate}
              placeholder={this.props.placeHolder}
            />
          </InputGroup>
        </ModalBody>
        <ModalFooter>
          <Button
            className={
              /*@tag<popup-input-modal-btn>*/ "popup-input-modal-btn-vcdat"
            }
            outline={true}
            color="primary"
            onClick={this.hide}
          >
            {this.state.input !== ""
              ? this.props.acceptText
              : this.props.cancelText}
          </Button>
        </ModalFooter>
      </Modal>
    );
  }
}
