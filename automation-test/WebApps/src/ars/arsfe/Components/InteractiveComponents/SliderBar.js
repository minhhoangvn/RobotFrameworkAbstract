import React from 'react';
import PropTypes from 'prop-types'
import { Layout, Menu, Icon, Tag, Row, Col } from 'antd';
const { Sider } = Layout;

SliderBarElement.prototypes = {
    menuItems: PropTypes.array,
    collapsed: PropTypes.bool,
    styleAttr: PropTypes.object
}
SliderBarElement.defaultProps = {
    menuItems: [],
    handleClickOnSliderBar: null,
    handleSelectOnSliderBar: null
}

export function SliderBarElement(props) {
    const listMenuItems = [];
    props.menuItems.map(function (item) {
        listMenuItems.push(
            <Menu.Item key={item.key}>
                <Icon type={item.iconType} className="slider-bar-icon" />
                <span className="nav-text">
                    <a className="slider-bar-link">{item.text}</a>
                </span>
            </Menu.Item>
        );
    });
    const eventHandler = (event) => {
        return event === null ? (event) => {console.log(event); } : event;
    }
    return (
        <Sider
            trigger={null}
            collapsible
            collapsed={props.collapsed}
            width={props.styleAttr.width}
            collapsedWidth={props.styleAttr.collapsedWidth}
        >
            <div className="logo" />
            <Menu
                theme="dark"
                mode="inline"
                defaultSelectedKeys={[props.activeMenu]}
                onClick={eventHandler(props.eventHandler.handleClickOnSliderBar)}
                onSelect={eventHandler(props.eventHandler.handleSelectOnSliderBar)}>
                {listMenuItems}
            </Menu>
        </Sider>
    );
}