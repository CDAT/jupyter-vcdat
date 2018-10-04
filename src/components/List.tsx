import * as React from 'react';

/**
 * A component to show a list and performs actions for clicked items
 * 
 * props:
 *  itemList: An array of strings listing the names to show in drop down.
 *  clickAction: Function to perform when a specific item in the list is clicked.
 *  hidden: A boolean value to show or hide the list
 */

class List extends React.Component <any, any> {

    //itemList: Array<string>;
    clickAction: Function;

    constructor(props: any){
        super(props)
        this.state = {
            activeItem: this.props.itemList[0], //Get first item and set as active by default
            collapsed: false //Whether list is hidden or shown
        }
        this.clickHandler = this.clickHandler.bind(this);
    }
    
    clickHandler(event: any,itemName: string) {
        console.log("Item: " + itemName + " was clicked. Event: " + event);
        this.setState({activeItem: itemName})
        this.props.clickAction(itemName);
        this.render();
    }

    render() {
        if(!this.state.collapsed){
            return (
                <ul id='var-list' className='no-bullets left-list'>
                    {this.props.itemList.map((itemName: string, index: number) => {
                        return (
                            <li key={index} className={this.state.activeItem===itemName ? 'active':''}>
                                <a href="#" onClick={(e: any) => this.clickHandler(e,itemName)}>{itemName}</a>
                            </li>
                        )
                    })}
                </ul>
            )
        }
    }
}

export default List;
