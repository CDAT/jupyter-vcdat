import * as React from 'react';

/**
 * A component to show a list and performs actions for clicked items
 * 
 * props:
 *  hidden: Boolean, whether the list should be hidden
 *  itemList: An array of strings listing the names to show in drop down.
 *  clickAction: Function to perform when a specific item in the list is clicked.
 */

const itemStyle = {
    margin: '2px 12px',
    testDecoration: 'none'
}

class List extends React.Component <any, any> {

    itemList: Array<string>;
    clickAction: Function;
    listName: string;
    activeList: string;
    activeItem: string;

    constructor(props: any){
        super(props)

        this.state = {
            listName: this.props.listName
        }
        this.clickHandler = this.clickHandler.bind(this);
        this.handleChange = this.handleChange.bind(this);
    };

    handleChange(e: any){
        this.props.onListSetChange(e.target.activeList);
        this.props.onListSetChange(e.target.activeItem);
        console.log("Change handled");
    }
    
    clickHandler(event: any, listName: string, itemName: string) {
        this.props.clickAction(listName,itemName);
    };

    render() {

        return (
            <ul id='var-list' className='no-bullets left-list'>
                {this.props.itemList.map((itemName: string, index: number) => {
                    return (
                        <li key={index} className={this.state.listName===this.props.activeList&&itemName===this.props.activeItem ? "active" : ""}>
                            <a href="#" style={itemStyle} onClick={(e) => this.clickHandler(e,this.state.listName,itemName)}>{itemName}</a>
                        </li>
                    )
                })}
            </ul>
        )
    }
};

export default List;
