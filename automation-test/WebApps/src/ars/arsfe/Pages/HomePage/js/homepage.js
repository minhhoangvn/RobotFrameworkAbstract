import React from 'react';
import '../static/style.css'
import { ReportSection } from './reportcomponent'
import { RunAutomationSection } from './runcomponent'
import { HomeSection } from './homecomponent'
import { SliderBarElement } from 'Components/InteractiveComponents/SliderBar'
import { Layout, Menu, Icon, Tag, Row, Col } from 'antd';
const { Header, Sider, Content } = Layout;
const tagsFromServer = [['Home', "/home/"], ['Run Auto', "/Run/"], ['View Reports', "/Reports/"]];

export default class HomePage extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            collapsed: true,
            sectionLoader: 'Home',
        };
        this.toggle = this.toggle.bind(this);
        this.handleClickOnSliderBar = this.handleClickOnSliderBar.bind(this);
        this.renderMainSection = this.renderMainSection.bind(this);
    }
    componentWillMount()
    {
        console.log("Will mount : "+new Date().getTime());
    }
    componentDidMount()
    {
        console.log("Done mount : "+new Date().getTime());
    }
    handleClickOnSliderBar(item) {
        this.setState(
            {
                sectionLoader: item.key,
            }
        )
    }

    toggle() {
        this.setState({
            collapsed: !this.state.collapsed,
        });
    }

    renderMainSection() {
        var section = null;
        switch (this.state.sectionLoader) {
            case "Home":
                return <HomeSection content={"This is home section"} />;
            case "Run":
                return <RunAutomationSection content={"This is run section"} />;
            case "Report":
                return <ReportSection content={"This is report section"} />;
            default:
                return <ReportSection content={"This is logout click section"} />;
        }
    }

    render() {
        const listMenu = [
            { key: "Home", text: "Home", iconType: "home" },
            { key: "Run", text: "Run Automation", iconType: "code" },
            { key: "Report", text: "View Report", iconType: "pie-chart" },
            { key: "Logout", text: "Logout", iconType: "logout" },
            { key: "Help", text: "Help", iconType: "question" }

        ];
        const sliderBarStyle = {
            width: 200,
            collapsedWidth: 150
        }
        SliderBarElement.__ANT_LAYOUT_SIDER = true;
        return (
            <Layout style={{ height: "100vh", with: "100vh" }}>
                <SliderBarElement
                    collapsed={this.state.collapsed}
                    eventHandler=
                    {
                        {
                            collapsed: this.state.collapsed,
                            handleClickOnSliderBar: this.handleClickOnSliderBar,
                        }
                    }
                    menuItems={listMenu}
                    styleAttr={sliderBarStyle}
                    activeMenu={this.state.sectionLoader}
                />
                <Layout style={{ height: "100vh", with: "100vh" }}>
                    <NavigationBar collapsed={this.state.collapsed} toggle={this.toggle} />
                    {this.renderMainSection()}
                </Layout>
                <p>{(new Date().getTime()).toString()}</p>
            </Layout>
        );
    }
}

const NavigationBar = (props) => {
    return (
        <div>
            <Header style={{ padding: "0px 10px" }}>
                <Row>
                    <Col span={6}>
                        <Icon
                            className="trigger collapsed-icon"
                            type={props.collapsed ? 'menu-unfold' : 'menu-fold'}
                            onClick={props.toggle}
                        />
                    </Col>
                    <Col span={8} offset={4}>
                        <h1 className="header-title">Automation System</h1>
                    </Col>
                </Row>
            </Header>
        </div>
    );
}