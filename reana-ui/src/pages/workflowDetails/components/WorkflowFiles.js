/*
	-*- coding: utf-8 -*-

	This file is part of REANA.
	Copyright (C) 2018 CERN.

	REANA is free software; you can redistribute it and/or modify it under the
	terms of the GNU General Public License as published by the Free Software
	Foundation; either version 2 of the License, or (at your option) any later
	version.

	REANA is distributed in the hope that it will be useful, but WITHOUT ANY
	WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR
	A PARTICULAR PURPOSE. See the GNU General Public License for more details.

	You should have received a copy of the GNU General Public License
	along with REANA; if not, see <http://www.gnu.org/licenses>.

	In applying this license, CERN does not waive the privileges and immunities
	granted to it by virtue of its status as an Intergovernmental Organization or
	submit itself to any jurisdiction.
*/

import React, { Component } from "react";
import axios from "axios";
import _ from "lodash";
import { Button, Header, Icon, Modal, Segment, Table } from "semantic-ui-react";
import Config from "../../../config";
import State from "../../../state";

export default class WorkflowFiles extends Component {
  /**
   * Variables defining the state of the table
   */
  constructor(props) {
    super(props);
    this.url = Config.api + "/api/workflows/" + State.details.id + "/";
    this.state = {
      modal_content: null,
      column: null,
      direction: null,
      files: props.files,
      title: props.title
    };
  }

  /**
   * Gets the file from the API
   */
  getFile = file_name => () => {
    axios({
      method: "get",
      url: this.url + "workspace/" + file_name,
      params: {
        access_token: State.login.user_token
      }
    }).then(res => {
      this.setState({ modal_content: res.data });
    });
  };

  /**
   * Downloads the file to the local machine
   */
  downloadFile = file_name => () => {
    const { modal_content } = this.state;

    let element = document.createElement("a");
    element.setAttribute(
      "href",
      "data:text/plain;charset=utf-8," + encodeURIComponent(modal_content)
    );
    element.setAttribute("download", file_name);
    element.style.display = "none";
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  /**
   * Performs the sorting when a column header is clicked
   */
  handleSort = clickedColumn => () => {
    const { column, files, direction } = this.state;

    if (column !== clickedColumn) {
      this.setState({
        column: clickedColumn,
        files: _.sortBy(files, [clickedColumn]),
        direction: "ascending"
      });
      return;
    }

    this.setState({
      files: files.reverse(),
      direction: direction === "ascending" ? "descending" : "ascending"
    });
  };

  render() {
    const { modal_content, column, direction, files, title } = this.state;

    return (
      <Segment raised padded secondary>
        <Header size="medium">{title}</Header>
        <Table fixed compact basic="very">
          <Table.Header>
            <Table.Row>
              <Table.HeaderCell
                sorted={column === "name" ? direction : null}
                onClick={this.handleSort("name")}
                style={{ cursor: "pointer" }}
              >
                Name
              </Table.HeaderCell>
              <Table.HeaderCell
                sorted={column === "mod_date" ? direction : null}
                onClick={this.handleSort("mod_date")}
                style={{ cursor: "pointer" }}
              >
                Modified date
              </Table.HeaderCell>
            </Table.Row>
          </Table.Header>

          <Table.Body className="files-list">
            {_.map(files, ({ name, mod_date }) => (
              <Modal
                key={name}
                onOpen={this.getFile(name)}
                className="modal-view"
                trigger={
                  <Table.Row className="files-row">
                    <Table.Cell>
                      <Icon name="file" />
                      {name}
                    </Table.Cell>
                    <Table.Cell>{mod_date}</Table.Cell>
                  </Table.Row>
                }
              >
                <Modal.Header className="modal-header">{name}</Modal.Header>
                <Modal.Content scrolling>
                  <pre>{modal_content}</pre>
                </Modal.Content>
                <Modal.Actions className="modal-actions">
                  <Button color="blue" onClick={this.downloadFile(name)}>
                    <Icon name="download" /> Download
                  </Button>
                </Modal.Actions>
              </Modal>
            ))}
          </Table.Body>
        </Table>
      </Segment>
    );
  }
}
