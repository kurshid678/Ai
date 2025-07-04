import React, { useState, useEffect } from "react";
import "./App.css";
import { BrowserRouter, Routes, Route, Link } from "react-router-dom";
import axios from "axios";
import Draggable from "react-draggable";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// Home component
const Home = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-center text-gray-800 mb-8">
          Certificate Generator
        </h1>
        <div className="grid md:grid-cols-2 gap-8">
          <Link
            to="/create-template"
            className="bg-white rounded-lg shadow-lg hover:shadow-xl transition-shadow p-8 text-center group"
          >
            <div className="text-blue-600 group-hover:text-blue-700 transition-colors">
              <svg className="w-16 h-16 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              <h2 className="text-2xl font-semibold mb-2">Create Template</h2>
              <p className="text-gray-600">Design a new certificate template with custom layouts</p>
            </div>
          </Link>
          
          <Link
            to="/generate-certificate"
            className="bg-white rounded-lg shadow-lg hover:shadow-xl transition-shadow p-8 text-center group"
          >
            <div className="text-green-600 group-hover:text-green-700 transition-colors">
              <svg className="w-16 h-16 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <h2 className="text-2xl font-semibold mb-2">Generate Certificate</h2>
              <p className="text-gray-600">Create certificates using your saved templates</p>
            </div>
          </Link>
        </div>
        
        <div className="mt-12 text-center">
          <Link
            to="/manage-templates"
            className="inline-flex items-center px-6 py-3 bg-gray-700 text-white rounded-lg hover:bg-gray-800 transition-colors"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            Manage Templates
          </Link>
        </div>
      </div>
    </div>
  );
};

// Create Template component
const CreateTemplate = () => {
  const [templateName, setTemplateName] = useState("");
  const [canvasSize, setCanvasSize] = useState({ width: 800, height: 600 });
  const [backgroundImage, setBackgroundImage] = useState("");
  const [inputs, setInputs] = useState([]);
  const [selectedInput, setSelectedInput] = useState(null);
  const [isEditing, setIsEditing] = useState(false);

  const handleBackgroundUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setBackgroundImage(e.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const addTextInput = () => {
    const newInput = {
      id: Date.now().toString(),
      x: 50,
      y: 50,
      width: 200,
      height: 40,
      placeholder: "Enter text",
      fontSize: 16,
      fontFamily: "Arial",
      color: "#000000"
    };
    setInputs([...inputs, newInput]);
    setSelectedInput(newInput.id);
  };

  const updateInputPosition = (id, x, y) => {
    setInputs(inputs.map(input => 
      input.id === id ? { ...input, x, y } : input
    ));
  };

  const updateInputProperties = (id, properties) => {
    setInputs(inputs.map(input => 
      input.id === id ? { ...input, ...properties } : input
    ));
  };

  const deleteInput = (id) => {
    setInputs(inputs.filter(input => input.id !== id));
    if (selectedInput === id) {
      setSelectedInput(null);
    }
  };

  const handleInputClick = (id) => {
    setSelectedInput(id);
  };

  const handleCanvasClick = (e) => {
    if (e.target.id === 'canvas-container') {
      setSelectedInput(null);
    }
  };

  const saveTemplate = async () => {
    if (!templateName.trim()) {
      alert("Please enter a template name");
      return;
    }

    try {
      const templateData = {
        name: templateName,
        width: canvasSize.width,
        height: canvasSize.height,
        backgroundImage,
        inputs
      };

      await axios.post(`${API}/templates`, templateData);
      alert("Template saved successfully!");
      setTemplateName("");
      setInputs([]);
      setBackgroundImage("");
    } catch (error) {
      console.error("Error saving template:", error);
      alert("Error saving template");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h1 className="text-3xl font-bold text-gray-800 mb-6">Create Certificate Template</h1>
          
          <div className="grid lg:grid-cols-4 gap-6">
            {/* Settings Panel */}
            <div className="lg:col-span-1 bg-gray-50 rounded-lg p-4 h-fit">
              <h2 className="text-xl font-semibold mb-4">Settings</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Template Name</label>
                  <input
                    type="text"
                    value={templateName}
                    onChange={(e) => setTemplateName(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter template name"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Canvas Size</label>
                  <div className="flex space-x-2">
                    <input
                      type="number"
                      value={canvasSize.width}
                      onChange={(e) => setCanvasSize({...canvasSize, width: parseInt(e.target.value)})}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Width"
                    />
                    <input
                      type="number"
                      value={canvasSize.height}
                      onChange={(e) => setCanvasSize({...canvasSize, height: parseInt(e.target.value)})}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Height"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Background Image</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleBackgroundUpload}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                <button
                  onClick={addTextInput}
                  className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors"
                >
                  Add Text Input
                </button>
                
                <button
                  onClick={saveTemplate}
                  className="w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 transition-colors"
                >
                  Save Template
                </button>
                
                <Link
                  to="/"
                  className="w-full bg-gray-600 text-white py-2 px-4 rounded-md hover:bg-gray-700 transition-colors block text-center"
                >
                  Back to Home
                </Link>
              </div>
            </div>
            
            {/* Canvas */}
            <div className="lg:col-span-3">
              <div className="bg-white border-2 border-gray-200 rounded-lg p-4">
                <h2 className="text-xl font-semibold mb-4">Canvas</h2>
                <div
                  className="relative border-2 border-dashed border-gray-300 mx-auto"
                  style={{ 
                    width: `${canvasSize.width}px`, 
                    height: `${canvasSize.height}px`,
                    backgroundImage: backgroundImage ? `url(${backgroundImage})` : 'none',
                    backgroundSize: 'cover',
                    backgroundPosition: 'center'
                  }}
                >
                  {inputs.map((input) => (
                    <Draggable
                      key={input.id}
                      position={{ x: input.x, y: input.y }}
                      onStop={(e, data) => updateInputPosition(input.id, data.x, data.y)}
                    >
                      <div
                        className="absolute cursor-move border-2 border-blue-500 bg-white bg-opacity-80 p-2 rounded group"
                        style={{
                          width: `${input.width}px`,
                          height: `${input.height}px`,
                          fontSize: `${input.fontSize}px`,
                          fontFamily: input.fontFamily,
                          color: input.color
                        }}
                      >
                        <input
                          type="text"
                          placeholder={input.placeholder}
                          className="w-full h-full border-none outline-none bg-transparent text-center"
                          style={{
                            fontSize: `${input.fontSize}px`,
                            fontFamily: input.fontFamily,
                            color: input.color
                          }}
                          onChange={(e) => updateInputProperties(input.id, { placeholder: e.target.value })}
                        />
                        <button
                          onClick={() => deleteInput(input.id)}
                          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          ×
                        </button>
                      </div>
                    </Draggable>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Generate Certificate component
const GenerateCertificate = () => {
  const [templates, setTemplates] = useState([]);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [inputValues, setInputValues] = useState({});
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      const response = await axios.get(`${API}/templates`);
      setTemplates(response.data);
    } catch (error) {
      console.error("Error fetching templates:", error);
    }
  };

  const handleTemplateSelect = (template) => {
    setSelectedTemplate(template);
    const initialValues = {};
    template.inputs.forEach(input => {
      initialValues[input.id] = "";
    });
    setInputValues(initialValues);
  };

  const handleInputChange = (inputId, value) => {
    setInputValues({
      ...inputValues,
      [inputId]: value
    });
  };

  const generatePDF = async () => {
    if (!selectedTemplate) return;

    setIsGenerating(true);
    try {
      const element = document.getElementById('certificate-preview');
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        allowTaint: true
      });

      const pdf = new jsPDF({
        orientation: selectedTemplate.width > selectedTemplate.height ? 'landscape' : 'portrait',
        unit: 'px',
        format: [selectedTemplate.width, selectedTemplate.height]
      });

      const imgData = canvas.toDataURL('image/png');
      pdf.addImage(imgData, 'PNG', 0, 0, selectedTemplate.width, selectedTemplate.height);
      pdf.save(`${selectedTemplate.name}_certificate.pdf`);
    } catch (error) {
      console.error("Error generating PDF:", error);
      alert("Error generating PDF");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h1 className="text-3xl font-bold text-gray-800 mb-6">Generate Certificate</h1>
          
          {!selectedTemplate ? (
            <div>
              <h2 className="text-xl font-semibold mb-4">Select a Template</h2>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {templates.map((template) => (
                  <div
                    key={template.id}
                    onClick={() => handleTemplateSelect(template)}
                    className="bg-white border border-gray-200 rounded-lg p-4 cursor-pointer hover:shadow-lg transition-shadow"
                  >
                    <div
                      className="w-full h-32 bg-gray-100 rounded-lg mb-4 bg-cover bg-center"
                      style={{
                        backgroundImage: template.backgroundImage ? `url(${template.backgroundImage})` : 'none'
                      }}
                    />
                    <h3 className="text-lg font-semibold">{template.name}</h3>
                    <p className="text-gray-600">{template.width} x {template.height}</p>
                  </div>
                ))}
              </div>
              
              <div className="mt-6">
                <Link
                  to="/"
                  className="bg-gray-600 text-white py-2 px-4 rounded-md hover:bg-gray-700 transition-colors"
                >
                  Back to Home
                </Link>
              </div>
            </div>
          ) : (
            <div className="grid lg:grid-cols-2 gap-6">
              {/* Input Form */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h2 className="text-xl font-semibold mb-4">Fill Certificate Details</h2>
                <div className="space-y-4">
                  {selectedTemplate.inputs.map((input) => (
                    <div key={input.id}>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {input.placeholder}
                      </label>
                      <input
                        type="text"
                        value={inputValues[input.id] || ""}
                        onChange={(e) => handleInputChange(input.id, e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder={input.placeholder}
                      />
                    </div>
                  ))}
                  
                  <div className="flex space-x-4">
                    <button
                      onClick={generatePDF}
                      disabled={isGenerating}
                      className="flex-1 bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 transition-colors disabled:opacity-50"
                    >
                      {isGenerating ? "Generating..." : "Generate PDF"}
                    </button>
                    <button
                      onClick={() => setSelectedTemplate(null)}
                      className="flex-1 bg-gray-600 text-white py-2 px-4 rounded-md hover:bg-gray-700 transition-colors"
                    >
                      Back to Templates
                    </button>
                  </div>
                </div>
              </div>
              
              {/* Preview */}
              <div className="bg-white rounded-lg p-4">
                <h2 className="text-xl font-semibold mb-4">Preview</h2>
                <div className="flex justify-center">
                  <div
                    id="certificate-preview"
                    className="relative border border-gray-300"
                    style={{
                      width: `${selectedTemplate.width}px`,
                      height: `${selectedTemplate.height}px`,
                      transform: 'scale(0.5)',
                      transformOrigin: 'top left',
                      backgroundImage: selectedTemplate.backgroundImage ? `url(${selectedTemplate.backgroundImage})` : 'none',
                      backgroundSize: 'cover',
                      backgroundPosition: 'center'
                    }}
                  >
                    {selectedTemplate.inputs.map((input) => (
                      <div
                        key={input.id}
                        className="absolute flex items-center justify-center"
                        style={{
                          left: `${input.x}px`,
                          top: `${input.y}px`,
                          width: `${input.width}px`,
                          height: `${input.height}px`,
                          fontSize: `${input.fontSize}px`,
                          fontFamily: input.fontFamily,
                          color: input.color,
                          textAlign: 'center'
                        }}
                      >
                        {inputValues[input.id] || input.placeholder}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Manage Templates component
const ManageTemplates = () => {
  const [templates, setTemplates] = useState([]);

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      const response = await axios.get(`${API}/templates`);
      setTemplates(response.data);
    } catch (error) {
      console.error("Error fetching templates:", error);
    }
  };

  const deleteTemplate = async (templateId) => {
    if (window.confirm("Are you sure you want to delete this template?")) {
      try {
        await axios.delete(`${API}/templates/${templateId}`);
        setTemplates(templates.filter(template => template.id !== templateId));
      } catch (error) {
        console.error("Error deleting template:", error);
        alert("Error deleting template");
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h1 className="text-3xl font-bold text-gray-800 mb-6">Manage Templates</h1>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {templates.map((template) => (
              <div key={template.id} className="bg-white border border-gray-200 rounded-lg p-4">
                <div
                  className="w-full h-32 bg-gray-100 rounded-lg mb-4 bg-cover bg-center"
                  style={{
                    backgroundImage: template.backgroundImage ? `url(${template.backgroundImage})` : 'none'
                  }}
                />
                <h3 className="text-lg font-semibold mb-2">{template.name}</h3>
                <p className="text-gray-600 mb-4">{template.width} x {template.height}</p>
                <p className="text-sm text-gray-500 mb-4">{template.inputs.length} inputs</p>
                <button
                  onClick={() => deleteTemplate(template.id)}
                  className="w-full bg-red-600 text-white py-2 px-4 rounded-md hover:bg-red-700 transition-colors"
                >
                  Delete Template
                </button>
              </div>
            ))}
          </div>
          
          {templates.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-500 text-lg">No templates found</p>
              <Link
                to="/create-template"
                className="inline-block mt-4 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors"
              >
                Create Your First Template
              </Link>
            </div>
          )}
          
          <div className="mt-6">
            <Link
              to="/"
              className="bg-gray-600 text-white py-2 px-4 rounded-md hover:bg-gray-700 transition-colors"
            >
              Back to Home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

function App() {
  return (
    <div className="App">
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/create-template" element={<CreateTemplate />} />
          <Route path="/generate-certificate" element={<GenerateCertificate />} />
          <Route path="/manage-templates" element={<ManageTemplates />} />
        </Routes>
      </BrowserRouter>
    </div>
  );
}

export default App;