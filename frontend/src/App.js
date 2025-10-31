import React, { useState, useRef, useEffect } from 'react';
import './index.css';
import LoginPage from './LoginPage';
import BlockedUserPage from './BlockedUserPage';
import QueryOptimizerPanel from './QueryOptimizerPanel';

// API Base URL
const API_BASE_URL = 'http://localhost:5000/api';

const TestCasesGenerator = () => {
  // Authentication state
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [authToken, setAuthToken] = useState(null);
  const [isBlocked, setIsBlocked] = useState(false);
  const [blockInfo, setBlockInfo] = useState(null);
  
  const [formData, setFormData] = useState({
    description: '',
    requirements: '',
    customInstructions: ''
  });
  
  const [uploadedImages, setUploadedImages] = useState([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [testCases, setTestCases] = useState([]);
  const [originalTestCases, setOriginalTestCases] = useState([]); // Store original for regeneration
  const [editingCase, setEditingCase] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [showConfirmationModal, setShowConfirmationModal] = useState(false);
  const [feedbackText, setFeedbackText] = useState('');
  const [isDragOver, setIsDragOver] = useState(false);
  const [progress, setProgress] = useState(0);
  const [showNotification, setShowNotification] = useState(false);
  const [currentTab, setCurrentTab] = useState('form'); // 'form' or 'results'
  const [notification, setNotification] = useState({ message: '', type: '' });
  const [backendStatus, setBackendStatus] = useState('unknown'); // 'connected', 'disconnected', 'unknown'
  const [showQueryOptimizer, setShowQueryOptimizer] = useState(false);
  const [theme, setTheme] = useState('dark'); // 'dark' or 'light'
  const [showWelcomePopup, setShowWelcomePopup] = useState(false);
  const [showQTestModal, setShowQTestModal] = useState(false);
  const [showLogoutConfirmation, setShowLogoutConfirmation] = useState(false);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [testCasesPerPage] = useState(50);
  
  const fileInputRef = useRef(null);
  
  // Check authentication on component mount
  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    const userInfo = localStorage.getItem('user_info');
    const savedTheme = localStorage.getItem('theme') || 'dark';
    const savedTestCases = localStorage.getItem('test_cases');
    const savedOriginalTestCases = localStorage.getItem('original_test_cases');
    const savedCurrentTab = localStorage.getItem('current_tab');
    
    setTheme(savedTheme);
    document.documentElement.setAttribute('data-theme', savedTheme);
    
    // Restore test cases if they exist
    if (savedTestCases) {
      try {
        const parsedTestCases = JSON.parse(savedTestCases);
        setTestCases(parsedTestCases);
        if (parsedTestCases.length > 0) {
          setCurrentTab('results'); // Switch to results tab if test cases exist
        }
      } catch (error) {
        console.error('Error parsing saved test cases:', error);
        localStorage.removeItem('test_cases');
      }
    }
    
    // Restore original test cases if they exist
    if (savedOriginalTestCases) {
      try {
        const parsedOriginalTestCases = JSON.parse(savedOriginalTestCases);
        setOriginalTestCases(parsedOriginalTestCases);
      } catch (error) {
        console.error('Error parsing saved original test cases:', error);
        localStorage.removeItem('original_test_cases');
      }
    }
    
    // Restore current tab
    if (savedCurrentTab && savedTestCases) {
      setCurrentTab(savedCurrentTab);
    }
    
    if (token && userInfo) {
      try {
        const parsedUser = JSON.parse(userInfo);
        setAuthToken(token);
        setUser(parsedUser);
        setIsAuthenticated(true);
        
        // Show welcome popup on page load/refresh if user is authenticated
        setTimeout(() => {
          setShowWelcomePopup(true);
        }, 1500);
      } catch (error) {
        console.error('Error parsing user info:', error);
        localStorage.removeItem('auth_token');
        localStorage.removeItem('user_info');
      }
    }
    
    checkBackendConnection();
  }, []);

  // Save test cases to localStorage whenever they change
  useEffect(() => {
    if (testCases.length > 0) {
      localStorage.setItem('test_cases', JSON.stringify(testCases));
      localStorage.setItem('current_tab', currentTab);
    } else {
      localStorage.removeItem('test_cases');
      localStorage.removeItem('current_tab');
    }
  }, [testCases, currentTab]);

  // Save original test cases to localStorage whenever they change
  useEffect(() => {
    if (originalTestCases.length > 0) {
      localStorage.setItem('original_test_cases', JSON.stringify(originalTestCases));
    } else {
      localStorage.removeItem('original_test_cases');
    }
  }, [originalTestCases]);

  // Theme toggle function
  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
  };
  
  // Authentication handlers
  const handleLoginSuccess = (userData, token) => {
    setUser(userData);
    setAuthToken(token);
    setIsAuthenticated(true);
    
    // Show welcome popup every time user logs in
    setTimeout(() => {
      setShowWelcomePopup(true);
      // Play notification sound
      const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmEcBzuJ1+3TfnwwAjN+y/rCaBoHLHfB7OxjBAAAAAAAAAC%3D'); // Simple notification beep
      audio.play().catch(() => {}); // Ignore errors if audio is blocked
    }, 1000);
  };
  
  const handleLogout = () => {
    setShowLogoutConfirmation(true);
  };

  const confirmLogout = () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user_info');
    setUser(null);
    setAuthToken(null);
    setIsAuthenticated(false);
    setIsBlocked(false);
    setBlockInfo(null);
    setShowLogoutConfirmation(false);
    showNotificationMessage('Successfully logged out!', 'success');
  };

  const cancelLogout = () => {
    setShowLogoutConfirmation(false);
  };

  // Handle welcome popup close
  const handleCloseWelcomePopup = () => {
    setShowWelcomePopup(false);
    // Remove localStorage setting since we want it to show every time
  };

  const handleOpenQueryOptimizer = () => {
    setShowQueryOptimizer(true);
    setShowWelcomePopup(false);
  };

  // Check backend connectivity on component mount
  useEffect(() => {
    checkBackendConnection();
  }, []);
  
  // Check backend connection
  const checkBackendConnection = async () => {
    try {
      const response = await fetch('http://localhost:5000/health', {
        method: 'GET',
        signal: AbortSignal.timeout(5000) // 5 second timeout
      });
      
      if (response.ok) {
        setBackendStatus('connected');
      } else {
        setBackendStatus('disconnected');
      }
    } catch (error) {
      setBackendStatus('disconnected');
      console.warn('Backend connection check failed:', error.message);
    }
  };
  
  // Show notification
  const showNotificationMessage = (message, type = 'success') => {
    setNotification({ message, type });
    setShowNotification(true);
    
    // Only auto-hide for success and info messages, keep error/warning messages until manually closed
    if (type === 'success' || type === 'info') {
      setTimeout(() => {
        setShowNotification(false);
      }, 10000); // Changed from 6000 to 10000 (10 seconds)
    }
    // For error and warning types, notification stays until user clicks close
  };

  // Handle Generate New Test Cases with confirmation
  const handleGenerateNewTestCases = () => {
    if (testCases.length > 0) {
      setShowConfirmationModal(true);
    } else {
      // No existing test cases, directly switch to form tab
      setCurrentTab('form');
    }
  };

  // Confirm clearing test cases and switch to form tab
  const confirmClearTestCases = () => {
    setTestCases([]);
    setOriginalTestCases([]);
    setCurrentTab('form');
    setShowConfirmationModal(false);
    // Clear localStorage when user manually resets
    localStorage.removeItem('test_cases');
    localStorage.removeItem('original_test_cases');
    localStorage.removeItem('current_tab');
    showNotificationMessage('Previous test cases cleared. Ready to generate new ones!', 'info');
  };

  // Cancel clearing test cases
  const cancelClearTestCases = () => {
    setShowConfirmationModal(false);
  };

  // API call to generate test cases with timeout handling
  const callGenerateTestCasesAPI = async (withImages = false) => {
    const formDataToSend = new FormData();
    formDataToSend.append('description', formData.description);
    formDataToSend.append('requirements', formData.requirements);
    formDataToSend.append('customInstructions', formData.customInstructions);
    
    if (withImages) {
      uploadedImages.forEach((image) => {
        formDataToSend.append('images', image.file);
      });
    }

    const endpoint = withImages 
      ? `${API_BASE_URL}/generate-test-cases-with-images`
      : `${API_BASE_URL}/generate-test-cases`;

    // Create AbortController for timeout handling
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 600000); // 10 minute timeout for large test cases

    try {
      const headers = withImages ? {
        'Authorization': `Bearer ${authToken}`
      } : {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      };

      const response = await fetch(endpoint, {
        method: 'POST',
        body: withImages ? formDataToSend : JSON.stringify({
          description: formData.description,
          requirements: formData.requirements,
          customInstructions: formData.customInstructions
        }),
        headers: headers,
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        let errorData;
        try {
          errorData = await response.json();
        } catch {
          errorData = { error: `HTTP ${response.status}: ${response.statusText}` };
        }
        
        // Handle blocked user
        if (errorData.type === 'USER_BLOCKED') {
          setIsBlocked(true);
          setBlockInfo(errorData.blockInfo);
          return null;
        }
        
        throw new Error(errorData.error || 'Failed to generate test cases');
      }

      return await response.json();
    } catch (error) {
      clearTimeout(timeoutId);
      if (error.name === 'AbortError') {
        throw new Error('Request timed out. Please try again with a shorter description or fewer images.');
      }
      throw error;
    }
  };

  // Apply human feedback with timeout handling
  const applyHumanFeedback = async () => {
    if (!feedbackText.trim()) {
      showNotificationMessage('Please provide feedback before regenerating', 'error');
      return;
    }

    try {
      setIsGenerating(true);
      setProgress(0);
      
      const progressInterval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + Math.random() * 15;
        });
      }, 200);

      // Create AbortController for timeout handling
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 180000); // 3 minute timeout

      try {
        const response = await fetch(`${API_BASE_URL}/apply-human-feedback`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}`
          },
          body: JSON.stringify({
            testCases: originalTestCases,
            feedbackPoints: feedbackText
          }),
          signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          let errorData;
          try {
            errorData = await response.json();
          } catch {
            errorData = { error: `HTTP ${response.status}: ${response.statusText}` };
          }
          
          // Pass the specific error details for better handling
          const errorMessage = errorData.details || errorData.error || 'Failed to apply feedback';
          throw new Error(errorMessage);
        }

        const result = await response.json();
        clearInterval(progressInterval);
        setProgress(100);
        
        // Handle both possible response formats for feedback
        let testCasesArray;
        if (Array.isArray(result.data)) {
          testCasesArray = result.data;
        } else if (result.data.testCases && Array.isArray(result.data.testCases)) {
          testCasesArray = result.data.testCases;
        } else {
          throw new Error('Invalid response format: testCases not found');
        }
        
        // Convert API response to UI format
        const convertedTestCases = testCasesArray.map((tc, index) => ({
          id: index + 1,
          number: `TC${String(index + 1).padStart(3, '0')}`, // Generate test case numbers
          testCase: tc.testCase,
          steps: Array.isArray(tc.steps) && tc.steps.length > 0 ? tc.steps.map(step => {
            // Handle step objects with action/expectedResult or plain strings
            if (typeof step === 'object' && step.action) {
              return `${step.action} - Expected: ${step.expectedResult}`;
            }
            return typeof step === 'string' ? step : String(step);
          }).join('\n') : 'No specific steps provided',
          priority: 'Medium' // Default since API doesn't return this
        }));
        
        setTestCases(convertedTestCases);
        setShowFeedbackModal(false);
        setFeedbackText('');
        showNotificationMessage('Test cases updated based on your feedback!', 'success');
        
      } catch (error) {
        clearTimeout(timeoutId);
        clearInterval(progressInterval);
        if (error.name === 'AbortError') {
          throw new Error('Request timed out. Please try again with shorter feedback.');
        }
        throw error;
      }
      
    } catch (error) {
      console.error('Error applying feedback:', error);
      
      // Provide more specific error messages based on error type
      let errorMessage = 'Failed to apply feedback';
      let errorType = 'error';
      
      if (error.message.includes('timeout') || error.message.includes('timed out')) {
        errorMessage = '⏱️ Request timed out. Please try again with shorter feedback.';
      } else if (error.message.includes('fetch') || error.message.includes('Network')) {
        errorMessage = '🔌 Network error. Please check your connection and ensure the backend server is running.';
      } else if (error.message.includes('Content Safety Violation') || error.message.includes('harmful or inappropriate')) {
        errorMessage = '⚠️ Content Safety Alert: Your feedback contains content that may be harmful or inappropriate.\n\nPlease revise your feedback and try again.\n\n⚠️ WARNING: You will be blocked for 2 days if you attempt this 2 times.';
        errorType = 'warning';
      } else if (error.message.includes('Invalid Feedback Scope') || error.message.includes('do not align with the application context')) {
        errorMessage = '❌ Invalid Feedback: Your feedback doesn\'t appear to be related to software test case improvement.\n\nPlease provide feedback that focuses on:\n• Test case quality and clarity\n• Coverage and accuracy\n• Specific testing scenarios\n• Constructive suggestions for improvement';
        errorType = 'warning';
      } else if (error.message.includes('Language Not Supported') || error.message.includes('not in English')) {
        errorMessage = '🌍 Language Error: Please provide your feedback in English only. Feedback must be written in English for proper test case regeneration.';
        errorType = 'warning';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      showNotificationMessage(errorMessage, errorType);
    } finally {
      setIsGenerating(false);
      setProgress(0);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Clear individual field functions
  const clearField = (fieldName) => {
    setFormData(prev => ({
      ...prev,
      [fieldName]: ''
    }));
  };

  // Clear all form fields and images
  const clearAllFields = () => {
    setFormData({
      description: '',
      requirements: '',
      customInstructions: ''
    });
    setUploadedImages([]);
    // Clear any existing test cases and switch to form tab
    setTestCases([]);
    setOriginalTestCases([]);
    setCurrentTab('form');
    // Remove from localStorage
    localStorage.removeItem('test_cases');
    localStorage.removeItem('original_test_cases');
    localStorage.removeItem('current_tab');
    showNotificationMessage('All fields cleared successfully!', 'success');
  };

  // Clear uploaded images only
  const clearAllImages = () => {
    setUploadedImages([]);
    showNotificationMessage('All images cleared!', 'success');
  };

  // Pagination functions
  const getPaginatedTestCases = () => {
    const indexOfLastTestCase = currentPage * testCasesPerPage;
    const indexOfFirstTestCase = indexOfLastTestCase - testCasesPerPage;
    return testCases.slice(indexOfFirstTestCase, indexOfLastTestCase);
  };

  const getTotalPages = () => {
    return Math.ceil(testCases.length / testCasesPerPage);
  };

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  const handlePreviousPage = () => {
    setCurrentPage(prev => Math.max(prev - 1, 1));
  };

  const handleNextPage = () => {
    setCurrentPage(prev => Math.min(prev + 1, getTotalPages()));
  };

  // Reset pagination when test cases change
  useEffect(() => {
    setCurrentPage(1);
  }, [testCases]);

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    const files = Array.from(e.dataTransfer.files);
    processFiles(files);
  };

  const processFiles = (files) => {
    files.forEach(file => {
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (event) => {
          const newImage = {
            id: Date.now() + Math.random(),
            file,
            url: event.target.result,
            name: file.name,
            instructions: '',
            size: (file.size / 1024 / 1024).toFixed(2) + ' MB'
          };
          setUploadedImages(prev => [...prev, newImage]);
        };
        reader.readAsDataURL(file);
      }
    });
  };
  
  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);
    processFiles(files);
  };
  
  const handleImageInstructionChange = (imageId, instructions) => {
    setUploadedImages(prev => 
      prev.map(img => 
        img.id === imageId ? { ...img, instructions } : img
      )
    );
  };
  
  const removeImage = (imageId) => {
    setUploadedImages(prev => prev.filter(img => img.id !== imageId));
  };
  
  const isFormValid = () => {
    return formData.description.trim() && formData.requirements.trim();
  };
  
  const generateTestCases = async () => {
    if (!isFormValid()) return;
    
    // Check backend connection first
    if (backendStatus === 'disconnected') {
      showNotificationMessage('Backend is not connected. Please ensure the backend server is running.', 'error');
      return;
    }
    
    setIsGenerating(true);
    setProgress(0);
    
    // Enhanced progress tracking for large test case generation
    let progressStage = 0; // 0: analyzing, 1: generating, 2: reviewing, 3: finalizing
    let currentStageMessage = '';
    
    const progressInterval = setInterval(() => {
      setProgress(prev => {
        let newStageMessage = '';
        
        // Stage-based progress for better UX
        if (prev < 20 && progressStage === 0) {
          // Analyzing stage
          newStageMessage = 'Analyzing requirements and preparing generation...';
          return prev + Math.random() * 3 + 1;
        } else if (prev < 70 && progressStage <= 1) {
          // Generation stage (longest)
          if (prev >= 20) {
            progressStage = 1;
            newStageMessage = 'Generating test cases with AI...';
          }
          return prev + Math.random() * 2 + 0.5;
        } else if (prev < 85 && progressStage <= 2) {
          // Review stage
          if (prev >= 70) {
            progressStage = 2;
            newStageMessage = 'Reviewing and optimizing test cases...';
          }
          return prev + Math.random() * 1.5 + 0.3;
        } else if (prev < 90 && progressStage <= 3) {
          // Finalizing stage
          if (prev >= 85) {
            progressStage = 3;
            newStageMessage = 'Finalizing and formatting results...';
          }
          return prev + Math.random() * 0.5 + 0.1;
        }
        
        // Update stage message if it changed
        if (newStageMessage && newStageMessage !== currentStageMessage) {
          currentStageMessage = newStageMessage;
          showNotificationMessage(newStageMessage, 'info');
        }
        
        return Math.min(prev, 90); // Cap at 90% until we get response
      });
    }, 800); // Slower updates for more realistic feel
    
    try {
      const withImages = uploadedImages.length > 0;
      
      // Initial status message
      showNotificationMessage('Starting test case generation...', 'info');
      
      const result = await callGenerateTestCasesAPI(withImages);
      
      clearInterval(progressInterval);
      setProgress(100);
      
      // Validate response structure
      if (!result || !result.data) {
        throw new Error('Invalid response format from server');
      }
      
      // Handle both possible response formats:
      // 1. result.data.testCases (newer format)
      // 2. result.data (direct array - current backend format)
      let testCasesArray;
      if (Array.isArray(result.data)) {
        testCasesArray = result.data;
      } else if (result.data.testCases && Array.isArray(result.data.testCases)) {
        testCasesArray = result.data.testCases;
      } else {
        throw new Error('Invalid response format: testCases not found');
      }        // Convert API response to UI format
        const convertedTestCases = testCasesArray.map((tc, index) => ({
          id: index + 1,
          number: `TC${String(index + 1).padStart(3, '0')}`, // Generate test case numbers
          testCase: tc.testCase || 'No test case description provided',
          steps: Array.isArray(tc.steps) && tc.steps.length > 0 ? tc.steps.map(step => {
            // Handle step objects with action/expectedResult or plain strings
            if (typeof step === 'object' && step.action) {
              return `${step.action} - Expected: ${step.expectedResult}`;
            }
            return typeof step === 'string' ? step : String(step);
          }).join('\n') : 'No specific steps provided',
          priority: 'Medium' // Default since API doesn't return this
        }));
      
      if (convertedTestCases.length === 0) {
        throw new Error('No test cases were generated. Please check your input and try again.');
      }
      
      setTestCases(convertedTestCases);
      setOriginalTestCases(testCasesArray); // Store original array for feedback
      setCurrentTab('results');
      
      // Enhanced success message with pagination info for large sets
      let successMessage = `${convertedTestCases.length} test cases generated successfully! 🎉`;
      if (convertedTestCases.length > testCasesPerPage) {
        const totalPages = Math.ceil(convertedTestCases.length / testCasesPerPage);
        successMessage += `\n\n📋 Results are paginated: ${totalPages} pages with ${testCasesPerPage} test cases per page.`;
      }
      showNotificationMessage(successMessage, 'success');
      
    } catch (error) {
      console.error('Error generating test cases:', error);
      clearInterval(progressInterval);
      
      // Provide more specific error messages based on error type
      let errorMessage = 'Failed to generate test cases';
      let errorType = 'error';
      
      if (error.message.includes('timeout') || error.message.includes('timed out')) {
        errorMessage = '⏱️ Generation timed out. This can happen with complex requirements or when generating many test cases.\n\n💡 Try these tips:\n• Break down complex requirements into smaller parts\n• Simplify your application description\n• Generate test cases in smaller batches\n• Check your internet connection\n\nThe system can handle large requests, but they may take up to 10 minutes.';
        errorType = 'warning';
      } else if (error.message.includes('fetch') || error.message.includes('Network')) {
        errorMessage = '🔌 Network error. Please check your connection and ensure the backend server is running.';
      } else if (error.message.includes('Content Safety Violation') || error.message.includes('harmful or inappropriate')) {
        errorMessage = '⚠️ Content Safety Alert: Your input contains content that may be harmful or inappropriate.\n\nPlease revise your description, requirements, or additional instructions and try again.\n\n⚠️ WARNING: You will be blocked for 2 days if you attempt this 2 times.';
        errorType = 'warning';
      } else if (error.message.includes('Invalid Request Scope') || error.message.includes('do not align with the application context')) {
        errorMessage = '❌ Invalid Request: Your input doesn\'t appear to be related to software test case generation.\n\nPlease ensure:\n• Background describes a software application\n• Requirements mention software features\n• Additional information relates to testing';
        errorType = 'warning';
      } else if (error.message.includes('Language Not Supported') || error.message.includes('not in English')) {
        errorMessage = '🌍 Language Error: Please provide your input in English only. All fields (description, requirements, and instructions) must be written in English for proper test case generation.';
        errorType = 'warning';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      showNotificationMessage(errorMessage, errorType);
      
      // Check backend connection if there was an error
      checkBackendConnection();
      
    } finally {
      setIsGenerating(false);
      setProgress(0);
    }
  };
  
  const editTestCase = (testCase) => {
    setEditingCase({ ...testCase });
    setShowEditModal(true);
  };
  
  const saveEditedTestCase = () => {
    setTestCases(prev => 
      prev.map(tc => 
        tc.id === editingCase.id ? editingCase : tc
      )
    );
    setShowEditModal(false);
    setEditingCase(null);
  };
  
  const downloadCSV = () => {
    const headers = ['Test Case Number', 'Test Case', 'Steps', 'Priority'];
    const csvContent = [
      headers.join(','),
      ...testCases.map(tc => [
        tc.number,
        `"${tc.testCase.replace(/"/g, '""')}"`,
        `"${tc.steps.replace(/"/g, '""')}"`,
        tc.priority
      ].join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'test-cases.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };
  
  const downloadJSON = () => {
    const jsonContent = JSON.stringify(testCases, null, 2);
    const blob = new Blob([jsonContent], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'test-cases.json';
    a.click();
    window.URL.revokeObjectURL(url);
  };
  
  const uploadToQTest = () => {
    setShowQTestModal(true);
  };

  // Early returns for authentication states
  if (!isAuthenticated) {
    return <LoginPage onLoginSuccess={handleLoginSuccess} />;
  }

  if (isBlocked) {
    return <BlockedUserPage blockInfo={blockInfo} onLogout={handleLogout} />;
  }

  return (
    <div className="app">
      {/* User Header */}
      <div className="user-header">
        <div className="user-info">
          <img 
            src={user?.picture || `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || 'User')}&background=667eea&color=fff&size=96&bold=true`} 
            alt={user?.name || 'User'} 
            className="user-avatar"
            onError={(e) => {
              // Fallback to initials-based avatar if Google profile image fails
              e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || 'User')}&background=667eea&color=fff&size=96&bold=true&format=svg`;
            }}
            loading="lazy"
          />
          <div className="user-details">
            <span className="user-name">{user?.name}</span>
            <span className="user-email">{user?.email}</span>
          </div>
        </div>
        <div className="user-actions">
          {user?.violationCount > 0 && (
            <div className="violation-warning">
              ⚠️ {user.violationCount}/2 violations
            </div>
          )}
          <button 
            className="theme-toggle-btn" 
            onClick={toggleTheme}
            title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
          >
            <span className="theme-icon">
              {theme === 'dark' ? '☀️' : '🌙'}
            </span>
          </button>
          <button 
            className="logout-btn" 
            onClick={handleLogout}
            title="Logout"
          >
            <span className="logout-icon">🔓</span>
            <span className="logout-text">Logout</span>
          </button>
        </div>
      </div>

    <div className="container">
      {/* Notification */}
      {showNotification && (
        <div className={`notification ${notification.type} show`}>
          <span>{notification.message}</span>
          <button onClick={() => setShowNotification(false)} className="notification-close">×</button>
        </div>
      )}

      {/* Tab Navigation */}
      <div className="tab-navigation">
        <button 
          className={`tab-btn ${currentTab === 'form' ? 'active' : ''}`}
          onClick={() => setCurrentTab('form')}
        >
          📝 Generate Test Cases
        </button>
        {testCases.length > 0 && (
          <button 
            className={`tab-btn ${currentTab === 'results' ? 'active' : ''}`}
            onClick={() => setCurrentTab('results')}
          >
            📋 Test Cases Results ({testCases.length})
          </button>
        )}
      </div>

      {currentTab === 'form' && (
        <>
          <div className="header">
            <h1>Biruni.AI</h1>
            <p>Transform your requirements into comprehensive test cases with the power of artificial intelligence</p>
            
            {/* Backend Status Indicator */}
            <div className={`backend-status ${backendStatus}`}>
              <span className="status-indicator"></span>
              {backendStatus === 'connected' && 'Backend Connected'}
              {backendStatus === 'disconnected' && 'Backend Disconnected - Please start the backend server'}
              {backendStatus === 'unknown' && 'Checking backend connection...'}
              {backendStatus === 'disconnected' && (
                <button 
                  className="retry-btn" 
                  onClick={checkBackendConnection}
                  style={{ marginLeft: '10px', padding: '2px 8px', fontSize: '12px' }}
                >
                  Retry
                </button>
              )}
            </div>
          </div>

          <div className="card">
            <div className="section-header-with-clear">
              <h2 className="section-title">📋 Application Details</h2>
              <button 
                className="btn btn-clear-all"
                onClick={clearAllFields}
                title="Clear all form fields and images"
              >
                🗑️ Clear All Fields
              </button>
            </div>
            
            <div className="form-grid">
              <div className="form-group form-full-width">
                <div className="form-label-with-clear">
                  <label className="form-label required" htmlFor="description">
                    💼 Application Description
                  </label>
                  {formData.description && (
                    <button 
                      type="button"
                      className="btn-clear-field"
                      onClick={() => clearField('description')}
                      title="Clear this field"
                    >
                      🗑️ Clear
                    </button>
                  )}
                </div>
                <textarea
                  id="description"
                  name="description"
                  className="form-textarea"
                  placeholder="Provide a detailed overview of your application, its purpose, and main functionality..."
                  value={formData.description}
                  onChange={handleInputChange}
                  rows={4}
                />
              </div>

              <div className="form-group form-full-width">
                <div className="form-label-with-clear">
                  <label className="form-label required" htmlFor="requirements">
                    📝 Requirements
                  </label>
                  {formData.requirements && (
                    <button 
                      type="button"
                      className="btn-clear-field"
                      onClick={() => clearField('requirements')}
                      title="Clear this field"
                    >
                      🗑️ Clear
                    </button>
                  )}
                </div>
                <textarea
                  id="requirements"
                  name="requirements"
                  className="form-textarea"
                  placeholder="Enter feature information, user stories, acceptance criteria, or specific requirements..."
                  value={formData.requirements}
                  onChange={handleInputChange}
                  rows={4}
                />
              </div>

              <div className="form-group form-full-width">
                <div className="form-label-with-clear">
                  <label className="form-label" htmlFor="customInstructions">
                    ⚙️ Custom Instructions (Optional)
                  </label>
                  {formData.customInstructions && (
                    <button 
                      type="button"
                      className="btn-clear-field"
                      onClick={() => clearField('customInstructions')}
                      title="Clear this field"
                    >
                      🗑️ Clear
                    </button>
                  )}
                </div>
                <textarea
                  id="customInstructions"
                  name="customInstructions"
                  className="form-textarea"
                  placeholder="Any specific instructions or guidelines for test case generation, including mock image instructions..."
                  value={formData.customInstructions}
                  onChange={handleInputChange}
                  rows={3}
                />
              </div>
            </div>

            <div className="form-group">
              <div className="form-label-with-clear">
                <h3 className="subsection-title">🖼️ Mock Images (Optional)</h3>
                {uploadedImages.length > 0 && (
                  <button 
                    type="button"
                    className="btn-clear-field"
                    onClick={clearAllImages}
                    title="Clear all images"
                  >
                    🗑️ Clear All ({uploadedImages.length})
                  </button>
                )}
              </div>
              
              <div 
                className={`file-upload-area ${isDragOver ? 'dragover' : ''}`}
                onClick={() => fileInputRef.current?.click()}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
              >
                <div className="upload-icon">
                  {isDragOver ? '⬇️' : '📁'}
                </div>
                <p style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '0.25rem', color: 'var(--text-primary)' }}>
                  {isDragOver ? 'Drop your images here!' : 'Drop your mock images here or click to browse'}
                </p>
                <p
              style={{
              fontSize: '0.85rem',
              color: 'rgba(255, 255, 255, 0.6)', // light color for dark theme
              margin: 0,
  }}
> Uploading too many images together can trigger rate limiting. Check limits with your provider.
</p>

              </div>
            
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*"
              onChange={handleImageUpload}
              style={{ display: 'none' }}
            />

            {uploadedImages.length > 0 && (
              <div className="uploaded-images">
                {uploadedImages.map(image => (
                  <div key={image.id} className="image-card">
                    <img src={image.url} alt={image.name} className="image-preview" />
                    <div className="image-name">
                      📎 {image.name}
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginLeft: '0.5rem' }}>
                        ({image.size})
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
            </div>
          </div>

          <div className="card" style={{ textAlign: 'center', padding: '1.25rem' }}>
            <div className="generate-actions">
              <button
                className="btn btn-primary"
                onClick={generateTestCases}
                disabled={!isFormValid() || isGenerating || backendStatus === 'disconnected'}
                style={{ fontSize: '1rem', padding: '1rem 2.5rem' }}
                title={backendStatus === 'disconnected' ? 'Backend server is not connected' : ''}
              >
                {isGenerating ? (
                  <>
                    <span className="loading-spinner"></span>
                    ✨ Generating Test Cases...
                  </>
                ) : backendStatus === 'disconnected' ? (
                  <>
                    ⚠️ Backend Disconnected
                  </>
                ) : (
                  <>
                    🎯 Generate Test Cases
                  </>
                )}
              </button>
            </div>
            
            {isGenerating && (
              <div className="progress-bar">
                <div className="progress-bar-fill" style={{ width: `${progress}%` }}></div>
              </div>
            )}
          </div>
        </>
      )}

      {currentTab === 'results' && testCases.length > 0 && (
        <>
          <div className="header">
            <h1>Generated Test Cases</h1>
            <p>Review, edit, and provide feedback on your generated test cases</p>
          </div>

          <div className="card">
            <div className="results-header">
              <h2 className="section-title">Test Cases Results</h2>
              <div className="results-actions">
                <button 
                  className="btn btn-secondary"
                  onClick={() => setShowFeedbackModal(true)}
                >
                  💭 Provide Feedback & Regenerate
                </button>
                <button 
                  className="btn btn-primary"
                  onClick={handleGenerateNewTestCases}
                >
                  🔄 Reset
                </button>
              </div>
            </div>
            
            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-number">{testCases.length}</div>
                <div className="stat-label">Total Test Cases</div>
              </div>
              <div className="stat-card">
                <div className="stat-number">{testCases.filter(tc => tc.steps && tc.steps.trim() && tc.steps !== 'No specific steps provided').length}</div>
                <div className="stat-label">With Detailed Steps</div>
              </div>
              <div className="stat-card">
                <div className="stat-number">{testCases.filter(tc => tc.priority === 'High').length}</div>
                <div className="stat-label">High Priority</div>
              </div>
            </div>
            
            <div style={{ overflowX: 'auto' }}>
              <table className="test-cases-table">
                <thead>
                  <tr>
                    <th>Test Case #</th>
                    <th>Test Case Description</th>
                    <th>Steps</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {getPaginatedTestCases().map(testCase => (
                    <tr key={testCase.id}>
                      <td>
                        <span style={{ 
                          background: 'var(--primary-gradient)', 
                          color: 'white', 
                          padding: '0.25rem 0.5rem', 
                          borderRadius: '0.5rem', 
                          fontSize: '0.8rem',
                          fontWeight: '600'
                        }}>
                          {testCase.number}
                        </span>
                      </td>
                      <td 
                        className="cell-description cell-tooltip" 
                        data-full-text={testCase.testCase}
                      >
                        {testCase.testCase}
                      </td>
                      <td 
                        className="cell-steps cell-tooltip" 
                        data-full-text={testCase.steps && testCase.steps !== 'No specific steps provided' ? testCase.steps : 'No specific steps provided'}
                      >
                        {testCase.steps && testCase.steps !== 'No specific steps provided' ? testCase.steps : (
                          <span style={{ fontStyle: 'italic', color: 'var(--text-secondary)' }}>
                            No specific steps provided
                          </span>
                        )}
                      </td>
                      <td>
                        <div className="test-case-actions">
                          <button
                            className="btn btn-outline btn-small"
                            onClick={() => editTestCase(testCase)}
                          >
                            ✏️ Edit
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination Info */}
            <div className="pagination-info">
              <span>
                Showing {((currentPage - 1) * testCasesPerPage) + 1} to {Math.min(currentPage * testCasesPerPage, testCases.length)} of {testCases.length} test cases
              </span>
            </div>

            {/* Pagination Controls */}
            {getTotalPages() > 1 && (
              <div className="pagination">
                <button 
                  className="pagination-btn" 
                  onClick={handlePreviousPage} 
                  disabled={currentPage === 1}
                  title="Previous page"
                >
                  ← Previous
                </button>
                
                {/* Show pagination numbers with ellipsis for large sets */}
                {(() => {
                  const totalPages = getTotalPages();
                  const delta = 2; // Show 2 pages before and after current page
                  const range = [];
                  const rangeWithDots = [];

                  for (let i = Math.max(2, currentPage - delta); i <= Math.min(totalPages - 1, currentPage + delta); i++) {
                    range.push(i);
                  }

                  if (currentPage - delta > 2) {
                    rangeWithDots.push(1, '...');
                  } else {
                    rangeWithDots.push(1);
                  }

                  rangeWithDots.push(...range);

                  if (currentPage + delta < totalPages - 1) {
                    rangeWithDots.push('...', totalPages);
                  } else if (totalPages > 1) {
                    rangeWithDots.push(totalPages);
                  }

                  return rangeWithDots.map((pageNum, index) => (
                    pageNum === '...' ? (
                      <span key={index} className="pagination-ellipsis">...</span>
                    ) : (
                      <button 
                        key={pageNum} 
                        className={`pagination-btn ${currentPage === pageNum ? 'active' : ''}`} 
                        onClick={() => handlePageChange(pageNum)}
                        title={`Go to page ${pageNum}`}
                      >
                        {pageNum}
                      </button>
                    )
                  ));
                })()}
                
                <button 
                  className="pagination-btn" 
                  onClick={handleNextPage} 
                  disabled={currentPage === getTotalPages()}
                  title="Next page"
                >
                  Next →
                </button>
              </div>
            )}

            <div className="download-actions">
              <button className="btn btn-secondary" onClick={downloadCSV}>
                📊 Export CSV
              </button>
              <button className="btn btn-secondary" onClick={downloadJSON}>
                📋 Export JSON
              </button>
              <button className="btn btn-success" onClick={uploadToQTest}>
                🚀 Upload to qTest
              </button>
            </div>
          </div>
        </>
      )}

      {/* Feedback Modal */}
      {showFeedbackModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h3 className="modal-title">💭 Provide Feedback</h3>
              <button
                className="close-btn"
                onClick={() => setShowFeedbackModal(false)}
              >
                ×
              </button>
            </div>
            
            <div className="form-group">
              <label className="form-label">
                📝 What improvements would you like to see in the test cases?
              </label>
              <textarea
                className="form-textarea"
                placeholder="Please describe what you'd like to improve in the test cases. For example:
- Add more detailed steps for TC001
- Include edge cases for login functionality
- Improve clarity of test case descriptions
- Add test cases for error scenarios"
                value={feedbackText}
                onChange={(e) => setFeedbackText(e.target.value)}
                rows={6}
              />
            </div>
            
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', paddingTop: '1rem' }}>
              <button
                className="btn btn-secondary"
                onClick={() => setShowFeedbackModal(false)}
              >
                ❌ Cancel
              </button>
              <button
                className="btn btn-primary"
                onClick={applyHumanFeedback}
                disabled={isGenerating || !feedbackText.trim()}
              >
                {isGenerating ? (
                  <>
                    <span className="loading-spinner"></span>
                    🔄 Regenerating...
                  </>
                ) : (
                  '🔄 Regenerate Test Cases'
                )}
              </button>
            </div>
            
            {isGenerating && (
              <div className="progress-bar" style={{ marginTop: '1rem' }}>
                <div className="progress-bar-fill" style={{ width: `${progress}%` }}></div>
              </div>
            )}
          </div>
        </div>
      )}

      {showEditModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h3 className="modal-title">✏️ Edit Test Case</h3>
              <button
                className="close-btn"
                onClick={() => setShowEditModal(false)}
              >
                ×
              </button>
            </div>
            
            <div className="form-group">
              <label className="form-label">🔢 Test Case Number</label>
              <input
                type="text"
                className="form-input"
                value={editingCase?.number || ''}
                onChange={(e) => setEditingCase(prev => ({ ...prev, number: e.target.value }))}
              />
            </div>
            
            <div className="form-group">
              <label className="form-label">📝 Test Case Description</label>
              <textarea
                className="form-textarea"
                value={editingCase?.testCase || ''}
                onChange={(e) => setEditingCase(prev => ({ ...prev, testCase: e.target.value }))}
                rows={3}
              />
            </div>
            
            <div className="form-group">
              <label className="form-label">📋 Steps</label>
              <textarea
                className="form-textarea"
                value={editingCase?.steps || ''}
                onChange={(e) => setEditingCase(prev => ({ ...prev, steps: e.target.value }))}
                rows={4}
              />
            </div>

            <div className="form-group">
              <label className="form-label">⚡ Priority</label>
              <select 
                className="form-input"
                value={editingCase?.priority || 'Medium'}
                onChange={(e) => setEditingCase(prev => ({ ...prev, priority: e.target.value }))}
              >
                <option value="High">High</option>
                <option value="Medium">Medium</option>
                <option value="Low">Low</option>
              </select>
            </div>
            
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', paddingTop: '1rem' }}>
              <button
                className="btn btn-secondary"
                onClick={() => setShowEditModal(false)}
              >
                ❌ Cancel
              </button>
              <button
                className="btn btn-primary"
                onClick={saveEditedTestCase}
              >
                💾 Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {showConfirmationModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h3 className="modal-title">⚠️ Clear Existing Test Cases?</h3>
              <button
                className="close-btn"
                onClick={cancelClearTestCases}
              >
                ×
              </button>
            </div>
            
            <div className="modal-content" style={{ padding: '1.5rem', textAlign: 'center' }}>
              <div style={{ marginBottom: '1rem', fontSize: '1.1rem', color: '#666' }}>
                You currently have <strong>{testCases.length} test case{testCases.length !== 1 ? 's' : ''}</strong> generated.
              </div>
              <div style={{ marginBottom: '1.5rem', color: '#e74c3c', fontWeight: '500' }}>
                Generating new test cases will clear all existing ones. This action cannot be undone.
              </div>
              <div style={{ color: '#7f8c8d', fontSize: '0.9rem' }}>
                Make sure to export your current test cases if you want to save them.
              </div>
            </div>
            
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', paddingTop: '1rem' }}>
              <button
                className="btn btn-secondary"
                onClick={cancelClearTestCases}
              >
                ❌ Cancel
              </button>
              <button
                className="btn btn-danger"
                onClick={confirmClearTestCases}
                style={{
                  backgroundColor: '#e74c3c',
                  borderColor: '#e74c3c',
                  color: 'white'
                }}
              >
                🗑️ Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>

    {/* Query Optimizer Sidebar */}
    <QueryOptimizerPanel
      isOpen={showQueryOptimizer}
      onClose={() => setShowQueryOptimizer(false)}
      authToken={authToken}
      showNotification={showNotificationMessage}
    />

    {/* Welcome Notification for Query Optimizer */}
    {showWelcomePopup && (
      <div className="welcome-notification">
        <div className="welcome-notification-content">
          <span className="welcome-icon">👨‍⚕️</span>
          <p>Hello! Need help writing better prompts? I'm here to assist you in generating amazing test cases!</p>
          <div className="welcome-actions">
            <button className="btn btn-small btn-primary" onClick={handleOpenQueryOptimizer}>
              Try Now
            </button>
          </div>
        </div>
        <button className="close-btn" onClick={handleCloseWelcomePopup}>
          ×
        </button>
      </div>
    )}

    {/* Custom qTest Upload Modal */}
    {showQTestModal && (
      <div className="modal-overlay">
        <div className="modal qtest-modal">
          <div className="modal-header">
            <h3 className="modal-title">🚀 qTest Integration</h3>
            <button className="close-btn" onClick={() => setShowQTestModal(false)}>
              ×
            </button>
          </div>
          <div className="qtest-content">
            <div className="qtest-hero">
              <div className="qtest-icon">🎯</div>
              <h4>Direct Integration Coming Soon!</h4>
              <p>We're working on seamless qTest integration to make your workflow even smoother.</p>
            </div>
            
            <div className="qtest-features">
              <div className="qtest-feature">
                <span className="feature-badge">🔗</span>
                <div>
                  <h5>One-Click Upload</h5>
                  <p>Upload test cases directly to your qTest projects</p>
                </div>
              </div>
              <div className="qtest-feature">
                <span className="feature-badge">🔄</span>
                <div>
                  <h5>Sync Updates</h5>
                  <p>Keep your test cases synchronized across platforms</p>
                </div>
              </div>
              <div className="qtest-feature">
                <span className="feature-badge">📊</span>
                <div>
                  <h5>Smart Mapping</h5>
                  <p>Intelligent field mapping for seamless data transfer</p>
                </div>
              </div>
            </div>

            <div className="qtest-interim">
              <h5>🎁 Meanwhile, export your test cases:</h5>
              <div className="interim-actions">
                <button className="btn btn-outline" onClick={() => { downloadCSV(); setShowQTestModal(false); }}>
                  📊 Download CSV
                </button>
                <button className="btn btn-outline" onClick={() => { downloadJSON(); setShowQTestModal(false); }}>
                  📋 Download JSON
                </button>
              </div>
            </div>

            <div className="qtest-footer">
              <p>Want to be notified when qTest integration is ready?</p>
              <button className="btn btn-secondary" onClick={() => setShowQTestModal(false)}>
                🔔 Notify Me
              </button>
            </div>
          </div>
        </div>
      </div>
    )}

    {/* Logout Confirmation Modal */}
    {showLogoutConfirmation && (
      <div className="modal-overlay">
        <div className="modal">
          <div className="modal-header">
            <h3 className="modal-title">🔓 Confirm Logout</h3>
            <button className="close-btn" onClick={cancelLogout}>
              ×
            </button>
          </div>
          
          <div className="modal-content" style={{ padding: '1.5rem', textAlign: 'center' }}>
            <div style={{ marginBottom: '1rem', fontSize: '1.1rem', color: 'var(--text-primary)' }}>
              Are you sure you want to log out?
            </div>
            <div style={{ marginBottom: '1.5rem', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
              You will need to sign in again to access the application.
            </div>
          </div>
          
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', paddingTop: '1rem' }}>
            <button className="btn btn-secondary" onClick={cancelLogout}>
              ❌ Cancel
            </button>
            <button className="btn btn-danger" onClick={confirmLogout}>
              🔓 Yes, Logout
            </button>
          </div>
        </div>
      </div>
    )}

    {/* Floating Action Button for Query Optimizer */}
    <button
      className="floating-action-btn"
      onClick={() => {
        setShowQueryOptimizer(true);
        setShowNotification(false); // Close any existing notifications
        setShowWelcomePopup(false); // Close welcome popup
      }}
      title="Open Query Optimizer"
    >
      👨‍⚕️
    </button>
    </div>
  );
};

export default TestCasesGenerator;
