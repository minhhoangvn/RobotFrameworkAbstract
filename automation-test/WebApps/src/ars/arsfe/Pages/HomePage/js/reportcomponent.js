import React from 'react';
import '../static/style.css'
import { Layout, Menu, Icon, Tag, Row, Col } from 'antd';
const { Header, Sider, Content } = Layout;



export const ReportSection = (props) => {
    return (
        <Row className='content-section'>
            <Col span={24} className='content-section'>
                <Content style={{ margin: '15px 5px', padding: '10px 10px', background: '#fff'}} className="content-section">
                    <p>This is Report Cotent: {props.content}</p>
                </Content>
            </Col>
        </Row>
    );
}