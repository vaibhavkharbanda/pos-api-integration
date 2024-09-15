import React, { useState } from 'react';
import axios from 'axios';
import { Form, Button, Alert, Container, Row, Col } from 'react-bootstrap';
import './App.css';  // Import custom CSS for hacker-style theme
import 'bootstrap/dist/css/bootstrap.min.css';  // Import Bootstrap CSS

const App = () => {
  const [formData, setFormData] = useState({
    username: 'test_user',
    appKey: 'test_app_key',
    pushTo: { deviceId: '' }, // Device ID will only contain the number input by the user
    amount: '500',
    mode: 'ALL',
    accountLabel: '',
    customerMobileNumber: '',
    externalRefNumber: '1234567890', // Mandatory field
    externalRefNumber2: '',
    externalRefNumber3: '',
    externalRefNumber4: '',
    customerEmail: '',
    origP2pRequestId: '' // Auto-populated from Start API response, used for Status and Cancel
  });

  const [response, setResponse] = useState(null);
  const [error, setError] = useState(null);
  const [curlCommand, setCurlCommand] = useState(null);
  const [currentApi, setCurrentApi] = useState(null);
  const [requestDetails, setRequestDetails] = useState({});
  const [showExternalFields, setShowExternalFields] = useState(1);  // Track how many external ref fields are shown

  // Define the correct URLs as per the documentation
  const baseApiUrl = 'https://demo.ezetap.com/api/3.0/p2padapter';

  // Handle form input change
  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === 'deviceId') {
      setFormData({
        ...formData,
        pushTo: { deviceId: value } // User only inputs the numeric part of the deviceId
      });
    } else {
      setFormData({
        ...formData,
        [name]: value
      });
    }
  };

  // Validate mandatory fields for Start API
  const validateStartFields = () => {
    const { username, appKey, pushTo, externalRefNumber, amount } = formData;
    if (!username || !appKey || !pushTo.deviceId || !externalRefNumber || !amount) {
      setError('Please fill in all mandatory fields (username, appKey, deviceId, externalRefNumber, and amount).');
      return false;
    }
    return true;
  };

  // Handle API calls
  const handleSubmit = async (e, api) => {
    e.preventDefault();
    setError(null);
    setResponse(null);
    setCurrentApi(api);

    if (api === 'start' && !validateStartFields()) return;

    const apiURL = `${baseApiUrl}/${api}`;
    const headers = { 'Content-Type': 'application/json' };

    let requestBody;

    // Append '|ezetap_android' to deviceId automatically
    const deviceIdWithSuffix = `${formData.pushTo.deviceId}|ezetap_android`;

    // Set request body based on the API being called
    if (api === 'start') {
      requestBody = {
        username: formData.username,
        appKey: formData.appKey,
        pushTo: { deviceId: deviceIdWithSuffix }, // Use the modified deviceId
        amount: formData.amount,
        mode: formData.mode,
        accountLabel: formData.accountLabel,
        customerMobileNumber: formData.customerMobileNumber,
        externalRefNumber: formData.externalRefNumber,
        externalRefNumber2: formData.externalRefNumber2,
        externalRefNumber3: formData.externalRefNumber3,
        externalRefNumber4: formData.externalRefNumber4,
        customerEmail: formData.customerEmail
      };
    } else if (api === 'status' || api === 'cancel') {
      requestBody = {
        username: formData.username,
        appKey: formData.appKey,
        origP2pRequestId: formData.origP2pRequestId // Populate origP2pRequestId for Status and Cancel
      };
    }

    try {
      const res = await axios.post(`http://localhost:5000/api/${api}`, requestBody, { headers }); // Local call for development
      setResponse(res.data);
      setRequestDetails({
        url: apiURL,  // Update the URL to the correct one for display
        headers,
        requestBody,
      });

      // If it's the Start API, auto-populate origP2pRequestId for Status and Cancel APIs
      if (api === 'start' && res.data.p2pRequestId) {
        setFormData({
          ...formData,
          origP2pRequestId: res.data.p2pRequestId
        });
      }
    } catch (err) {
      setError(`Error: ${err.message}`);
    }
  };

  // Generate CURL command
  const generateCurl = () => {
    if (!currentApi) {
      setError('Please hit an API first.');
      return;
    }
    const curlCmd = `curl -X POST ${requestDetails.url} -H 'Content-Type: application/json' -d '${JSON.stringify(requestDetails.requestBody)}'`;
    setCurlCommand(curlCmd);
  };

  // Copy CURL command to clipboard
  const copyToClipboard = () => {
    navigator.clipboard.writeText(curlCommand);
  };

  // Helper function to highlight keys and values in the request body
  const highlightJson = (json) => {
    if (typeof json !== 'string') {
      json = JSON.stringify(json, undefined, 2);
    }

    json = json.replace(/&/g, '&').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    return json.replace(/("([^"]+)")\s*:/g, '<span class="key">$1</span>:')  // Highlight keys
               .replace(/("(.*?)")/g, '<span class="string">$1</span>')      // Highlight strings
               .replace(/\b(true|false)\b/g, '<span class="boolean">$1</span>') // Highlight booleans
               .replace(/\b(null)\b/g, '<span class="null">$1</span>')       // Highlight nulls
               .replace(/\b(\d+)\b/g, '<span class="number">$1</span>');     // Highlight numbers
  };

  // Function to show additional externalRef fields
  const showMoreExternalFields = () => {
    if (showExternalFields < 4) {
      setShowExternalFields(showExternalFields + 1);
    }
  };

  return (
    <Container className="mt-5">
      <h1 className="text-center mb-4">POS API Engine</h1>

      {/* Error Alert */}
      {error && <Alert variant="danger">{error}</Alert>}

      {/* Response Alert */}
      {response && <Alert variant="success">API Response: <pre>{JSON.stringify(response, null, 2)}</pre></Alert>}

      <Form>
        <Form.Group as={Row} controlId="username">
          <Form.Label column sm="3">Username (Required)</Form.Label>
          <Col sm="9">
            <Form.Control
              type="text"
              name="username"
              placeholder="Enter Username"
              value={formData.username}
              onChange={handleChange}
            />
          </Col>
        </Form.Group>

        <Form.Group as={Row} controlId="appKey">
          <Form.Label column sm="3">App Key (Required)</Form.Label>
          <Col sm="9">
            <Form.Control
              type="text"
              name="appKey"
              placeholder="Enter App Key"
              value={formData.appKey}
              onChange={handleChange}
            />
          </Col>
        </Form.Group>

        <Form.Group as={Row} controlId="deviceId">
          <Form.Label column sm="3">Device ID (Required)</Form.Label>
          <Col sm="9">
            <Form.Control
              type="text"
              name="deviceId"
              placeholder="Enter Device ID (numeric part)"
              value={formData.pushTo.deviceId}
              onChange={handleChange}
            />
          </Col>
        </Form.Group>

        <Form.Group as={Row} controlId="externalRefNumber">
          <Form.Label column sm="3">External Ref Number (Required)</Form.Label>
          <Col sm="9">
            <Form.Control
              type="text"
              name="externalRefNumber"
              placeholder="Enter External Ref Number"
              value={formData.externalRefNumber}
              onChange={handleChange}
            />
          </Col>
        </Form.Group>

        <Form.Group as={Row} controlId="amount">
          <Form.Label column sm="3">Amount (Required)</Form.Label>
          <Col sm="9">
            <Form.Control
              type="text"
              name="amount"
              placeholder="Enter Amount"
              value={formData.amount}
              onChange={handleChange}
            />
          </Col>
        </Form.Group>

        {/* Optional Fields for Start API */}
        <Form.Group as={Row} controlId="mode">
          <Form.Label column sm="3">Mode (Optional)</Form.Label>
          <Col sm="9">
            <Form.Control
              type="text"
              name="mode"
              placeholder="Enter Mode (ALL, CASH, CARD)"
              value={formData.mode}
              onChange={handleChange}
            />
          </Col>
        </Form.Group>

        <Form.Group as={Row} controlId="accountLabel">
          <Form.Label column sm="3">Account Label (Optional)</Form.Label>
          <Col sm="9">
            <Form.Control
              type="text"
              name="accountLabel"
              placeholder="Enter Account Label"
              value={formData.accountLabel}
              onChange={handleChange}
            />
          </Col>
        </Form.Group>

        <Form.Group as={Row} controlId="customerMobileNumber">
          <Form.Label column sm="3">Customer Mobile Number (Optional)</Form.Label>
          <Col sm="9">
            <Form.Control
              type="text"
              name="customerMobileNumber"
              placeholder="Enter Customer Mobile Number"
              value={formData.customerMobileNumber}
              onChange={handleChange}
            />
          </Col>
        </Form.Group>

        {/* External Ref Number 2 */}
        {showExternalFields >= 2 && (
          <Form.Group as={Row} controlId="externalRefNumber2">
            <Form.Label column sm="3">External Ref Number 2 (Optional)</Form.Label>
            <Col sm="9">
              <Form.Control
                type="text"
                name="externalRefNumber2"
                placeholder="Enter External Ref Number 2"
                value={formData.externalRefNumber2}
                onChange={handleChange}
              />
            </Col>
          </Form.Group>
        )}

        {/* External Ref Number 3 */}
        {showExternalFields >= 3 && (
          <Form.Group as={Row} controlId="externalRefNumber3">
            <Form.Label column sm="3">External Ref Number 3 (Optional)</Form.Label>
            <Col sm="9">
              <Form.Control
                type="text"
                name="externalRefNumber3"
                placeholder="Enter External Ref Number 3"
                value={formData.externalRefNumber3}
                onChange={handleChange}
              />
            </Col>
          </Form.Group>
        )}

        {/* External Ref Number 4 */}
        {showExternalFields >= 4 && (
          <Form.Group as={Row} controlId="externalRefNumber4">
            <Form.Label column sm="3">External Ref Number 4 (Optional)</Form.Label>
            <Col sm="9">
              <Form.Control
                type="text"
                name="externalRefNumber4"
                placeholder="Enter External Ref Number 4"
                value={formData.externalRefNumber4}
                onChange={handleChange}
              />
            </Col>
          </Form.Group>
        )}

        {/* Show more button */}
        {showExternalFields < 4 && (
          <Button variant="secondary" onClick={showMoreExternalFields}>
            + Add More External Ref Number
          </Button>
        )}

        <Form.Group as={Row} controlId="customerEmail">
          <Form.Label column sm="3">Customer Email (Optional)</Form.Label>
          <Col sm="9">
            <Form.Control
              type="text"
              name="customerEmail"
              placeholder="Enter Customer Email"
              value={formData.customerEmail}
              onChange={handleChange}
            />
          </Col>
        </Form.Group>

        {/* Fields for Status and Cancel API */}
        {(currentApi === 'status' || currentApi === 'cancel') && (
          <Form.Group as={Row} controlId="origP2pRequestId">
            <Form.Label column sm="3">origP2pRequestId (Required)</Form.Label>
            <Col sm="9">
              <Form.Control
                type="text"
                name="origP2pRequestId"
                placeholder="Enter origP2pRequestId"
                value={formData.origP2pRequestId}
                onChange={handleChange}
              />
            </Col>
          </Form.Group>
        )}

        <Row className="mt-4">
          <Col className="text-center">
            <Button variant="primary" onClick={(e) => handleSubmit(e, 'start')} className="mr-2">Start API</Button>
            <Button variant="primary" onClick={(e) => handleSubmit(e, 'status')} className="mr-2">Status API</Button>
            <Button variant="primary" onClick={(e) => handleSubmit(e, 'cancel')}>Cancel API</Button>
          </Col>
        </Row>
      </Form>

      {/* Request Details Section */}
      {requestDetails.url && (
        <div className="mt-5 request-details">
          <h4>Request Details</h4>
          <p><strong>URL:</strong> <code>{requestDetails.url}</code></p>
          <p><strong>Headers:</strong> <pre className="highlighted">{JSON.stringify(requestDetails.headers, null, 2)}</pre></p>
          <p><strong>Request Body:</strong> <pre className="highlighted" dangerouslySetInnerHTML={{ __html: highlightJson(requestDetails.requestBody) }} /></p>
        </div>
      )}

      {/* CURL Command Section */}
      <div className="mt-5">
        <h4>CURL Command</h4>
        <Button variant="secondary" onClick={generateCurl} className="mr-2">Get CURL</Button>
        {curlCommand && (
          <>
            <pre>{curlCommand}</pre>
            <Button variant="secondary" onClick={copyToClipboard}>Copy CURL to Clipboard</Button>
          </>
        )}
      </div>
    </Container>
  );
};

export default App;
