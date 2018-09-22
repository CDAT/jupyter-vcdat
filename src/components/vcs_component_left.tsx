import * as React from 'react';

export class VCSComponentLeft extends React.Component<any, any> {

    constructor(props: any) {
        super(props);
        this.state = {
            file_path: '',
            selected_var: '',
        };
        this.props = props;
    }

    componentDidMount() {
        console.log('mounted VCSComponentLeft');
        this.handleChange = this.handleChange.bind(this);
    }

    handleChange(event: any) {
        console.log(event);
    }

    render() {
        return (
            <div>
                <h1>HELLO {this.props.thing}</h1>
                <button onClick={(e) => {this.handleChange(e)}}> CLICK ME </button>
            </div>
        )
    }
}