import * as React from 'react';

export class VCSComponentLeft extends React.Component<any, any> {

    constructor(props: any) {
        super(props);
        this.state = {
            file_path: '',
            selected_var: '',
            CMD_STR: [
                '#This code was injected by clicking on the button in left area.\nmsg = "Hello world!"\nprint(msg)',
                "#This is another command.\nmsg = 5+9\nprint(msg)"
            ]
        };
        this.props = props;
    }

    componentDidMount() {
        console.log('mounted VCSComponentLeft');
        this.handleChange = this.handleChange.bind(this);
    }

    handleChange(event: any, cmd: string) {
        this.props.clickHandler(cmd);
        console.log(event);
    }

    render() {
        return (
            <div>
                <h1>{this.props.title}</h1>
                <p>
                    <button onClick={(e) => {this.handleChange(e,this.state.CMD_STR[0])}}> CLICK ME </button><br />
                    <button onClick={(e) => {this.handleChange(e,this.state.CMD_STR[1])}}> CLICK ME 2</button>
                </p>
            </div>
        )
    }
}