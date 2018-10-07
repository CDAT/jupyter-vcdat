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

type ListProps = {
    listName: string        // the name of the active list
    clickAction: any        // a function to call when an item is clicked
    itemList: any           // a list of items
    activeItem: string      // the name of the active item
    activeList: string      // the name of the active list
}

class List extends React.Component<ListProps, any> {

    itemList: Array<string>;
    clickAction: Function;
    listName: string;
    activeList: string;
    activeItem: string;

    constructor(props: any) {
        super(props)

        this.state = {
            listName: this.props.listName
        }
        this.clickHandler = this.clickHandler.bind(this);
    };

    clickHandler(event: any, listName: string, itemName: string) {
        this.setState({
            activeList: listName, 
            activeItem: itemName
        });
        this.props.clickAction(listName, itemName);
    };

    render() {
        return (
            <ul id='var-list' className='no-bullets left-list'>
                {this.props.itemList.map((itemName: string, index: number) => {
                    let liClassName;
                    if (this.state.listName === this.state.activeList && itemName === this.state.activeItem) {
                        liClassName = 'active';
                    } else {
                        liClassName = ""
                    }
                    return (
                        <li key={index} className={liClassName}>
                            <a href="#"
                                style={itemStyle}
                                onClick={(event: any) => {
                                    this.clickHandler(event,
                                        this.state.listName,
                                        itemName)
                                }}>
                                {itemName}
                            </a>
                        </li>
                    )
                })}
            </ul>
        )
    }
};

export default List;
