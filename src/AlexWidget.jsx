import React, { useState, useRef, useEffect } from 'react';

const AlexWidget = () => {
  const [messages, setMessages] = useState([
    {
      id: 1,
      role: 'assistant',
      content: "Hi there! I'm Alex, RBG Surfaces' countertop specialist. I'm here to help you find the perfect material for your project and answer any questions about installation, design, or maintenance. What kind of project are you working on?",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [showCTA, setShowCTA] = useState(false);
  const [selectedCTA, setSelectedCTA] = useState(null);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // System prompt for Alex
  const systemPrompt = `You are Alex, the premium countertop specialist for RBG Surfaces (formerly Rock Bottom Granite), a family-owned surface supply business in Garden City, Idaho. Your expertise covers granite, quartz, engineered stone, and other premium surfaces.

BUSINESS DETAILS:
- Company: RBG Surfaces
- Phone: (208) 376-7328
- Website: rbgsurfaces.com
- Location: 5103 N Sawyer Ave, Garden City, Idaho
- Live Inventory: rockbottomgranite.stoneprofitsweb.com
- Partnership: Perma Treat sealing services

YOUR ROLE:
You guide customers through the countertop journey. You understand:
1. Material selection (granite, quartz, engineered stone) - durability, aesthetics, maintenance
2. The 4-step RBG process: Consultation → Selection → Design → Installation
3. Edge details, finishes, and customization options
4. Sealing and maintenance best practices
5. Design compatibility with cabinets, backsplash, and kitchen/bath style
6. Budget guidance and value proposition

CONVERSATION STYLE:
- Warm, knowledgeable, genuinely helpful
- Ask clarifying questions about their project (kitchen remodel, bathroom, island, etc.)
- Understand their lifestyle (busy family vs. low-traffic space affects material choice)
- Share expertise without being pushy
- Personalize recommendations to their specific needs
- Only state facts you're certain about; defer to the RBG team for specifics
- Reference your live inventory portal when relevant (rockbottomgranite.stoneprofitsweb.com)

CUSTOMER TYPES:
- Homeowners (DIY, designing their own space)
- Contractors (need bulk sourcing, project timelines)
- Designers/Architects (aesthetic + specification requirements)

Tailor your language and depth to each type. After 3-4 exchanges, naturally suggest: "I'd love to help you move forward. Would you prefer to: 1) Email us a drawing for a free estimate, 2) Provide your contact info so our team can follow up with specific materials & pricing, or 3) Book a consultation with our countertop design specialist?"

NEVER:
- Guarantee specific stock without checking the live portal
- Make up pricing
- Claim to access real-time inventory directly
- Use phrases like "I don't have that information" - instead, say "That's a great question - our team at (208) 376-7328 can give you the most current details."

Your goal: Build trust, educate, and guide them toward booking a consultation or submitting project details.`;

  const callClaudeAPI = async (userMessage) => {
    const conversationHistory = messages
      .filter(m => m.id > 1) // Skip initial greeting for context
      .map(m => ({
        role: m.role,
        content: m.content,
      }));

    const newMessage = {
      role: 'user',
      content: userMessage,
    };

    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': process.env.REACT_APP_ANTHROPIC_API_KEY || '', // Will be set at deployment
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 500,
          system: systemPrompt,
          messages: [...conversationHistory, newMessage],
        }),
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const data = await response.json();
      const assistantMessage = data.content[0].text;

      return assistantMessage;
    } catch (error) {
      console.error('Error calling Claude API:', error);
      return "I'm having trouble connecting right now. Please call us at (208) 376-7328 or visit rbgsurfaces.com. We're happy to help!";
    }
  };

  const handleSendMessage = async () => {
    if (!input.trim()) return;

    // Add user message
    const userMessage = {
      id: messages.length + 1,
      role: 'user',
      content: input,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    // Get AI response
    const response = await callClaudeAPI(input);
    const assistantMessage = {
      id: messages.length + 2,
      role: 'assistant',
      content: response,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, assistantMessage]);
    setLoading(false);

    // Check if we should show CTA buttons (after 3-4 exchanges)
    if (messages.length > 8 && !showCTA) {
      setTimeout(() => setShowCTA(true), 500);
    }
  };

  const handleCTASelection = (cta) => {
    setSelectedCTA(cta);
  };

  const handleFormSubmit = (e, cta) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData);

    // Create Netlify form submission
    fetch('/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        'form-name': cta,
        ...data,
      }).toString(),
    })
      .then(() => {
        // Add confirmation message
        setMessages(prev => [
          ...prev,
          {
            id: prev.length + 1,
            role: 'assistant',
            content: `Perfect! We've received your request. Our team will be in touch within 24 hours at ${data.email || data.phone}. In the meantime, feel free to explore our inventory at rockbottomgranite.stoneprofitsweb.com or call us at (208) 376-7328!`,
            timestamp: new Date(),
          },
        ]);
        setSelectedCTA(null);
      })
      .catch(error => {
        console.error('Form submission error:', error);
        setMessages(prev => [
          ...prev,
          {
            id: prev.length + 1,
            role: 'assistant',
            content: "Thanks for that info! Please call us at (208) 376-7328 to confirm your details. Our team is ready to help!",
            timestamp: new Date(),
          },
        ]);
      });
  };

  // CTA Buttons Component
  const CTAButtons = () => (
    <div style={{
      display: 'grid',
      gridTemplateColumns: '1fr',
      gap: '10px',
      margin: '16px 0',
      padding: '12px',
      backgroundColor: 'rgba(100, 120, 95, 0.05)',
      borderRadius: '8px',
    }}>
      <p style={{ margin: '0 0 12px', fontSize: '14px', fontWeight: '500', color: '#333' }}>
        What would help you most right now?
      </p>
      <button
        onClick={() => handleCTASelection('estimate')}
        style={{
          padding: '10px 12px',
          backgroundColor: '#f5f5f5',
          border: '1px solid #d0d0d0',
          borderRadius: '6px',
          cursor: 'pointer',
          fontSize: '14px',
          fontWeight: '500',
          color: '#333',
          transition: 'all 0.2s',
        }}
        onHover={e => e.target.style.backgroundColor = '#ebebeb'}
      >
        📐 Email a drawing for free estimate
      </button>
      <button
        onClick={() => handleCTASelection('followup')}
        style={{
          padding: '10px 12px',
          backgroundColor: '#f5f5f5',
          border: '1px solid #d0d0d0',
          borderRadius: '6px',
          cursor: 'pointer',
          fontSize: '14px',
          fontWeight: '500',
          color: '#333',
          transition: 'all 0.2s',
        }}
      >
        📋 Get a personalized follow-up
      </button>
      <button
        onClick={() => handleCTASelection('book')}
        style={{
          padding: '10px 12px',
          backgroundColor: '#64785f',
          border: 'none',
          borderRadius: '6px',
          cursor: 'pointer',
          fontSize: '14px',
          fontWeight: '500',
          color: 'white',
          transition: 'all 0.2s',
        }}
      >
        ✓ Book with a countertop specialist
      </button>
    </div>
  );

  // Form Components
  const EstimateForm = () => (
    <form
      name="estimate"
      onSubmit={e => handleFormSubmit(e, 'estimate')}
      style={{
        display: 'grid',
        gap: '12px',
        padding: '12px',
        backgroundColor: '#f9f9f9',
        borderRadius: '6px',
        marginTop: '12px',
      }}
    >
      <input
        type="hidden"
        name="form-name"
        value="estimate"
      />
      <input
        type="text"
        name="name"
        placeholder="Your name"
        required
        style={{ padding: '8px 12px', border: '1px solid #ddd', borderRadius: '4px', fontSize: '14px' }}
      />
      <input
        type="email"
        name="email"
        placeholder="Email address"
        required
        style={{ padding: '8px 12px', border: '1px solid #ddd', borderRadius: '4px', fontSize: '14px' }}
      />
      <input
        type="tel"
        name="phone"
        placeholder="Phone (optional)"
        style={{ padding: '8px 12px', border: '1px solid #ddd', borderRadius: '4px', fontSize: '14px' }}
      />
      <label style={{ fontSize: '13px', color: '#666' }}>
        <input type="file" name="drawing" accept=".pdf,.jpg,.png" style={{ marginRight: '8px' }} />
        Attach your drawing (PDF/image)
      </label>
      <textarea
        name="details"
        placeholder="Brief project details (optional)"
        style={{
          padding: '8px 12px',
          border: '1px solid #ddd',
          borderRadius: '4px',
          fontSize: '14px',
          minHeight: '80px',
          fontFamily: 'inherit',
        }}
      />
      <button
        type="submit"
        style={{
          padding: '10px',
          backgroundColor: '#64785f',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer',
          fontWeight: '500',
          fontSize: '14px',
        }}
      >
        Submit for Estimate
      </button>
      <button
        type="button"
        onClick={() => setSelectedCTA(null)}
        style={{
          padding: '8px',
          backgroundColor: 'transparent',
          color: '#666',
          border: '1px solid #ddd',
          borderRadius: '4px',
          cursor: 'pointer',
          fontSize: '13px',
        }}
      >
        Cancel
      </button>
    </form>
  );

  const FollowupForm = () => (
    <form
      name="followup"
      onSubmit={e => handleFormSubmit(e, 'followup')}
      style={{
        display: 'grid',
        gap: '12px',
        padding: '12px',
        backgroundColor: '#f9f9f9',
        borderRadius: '6px',
        marginTop: '12px',
      }}
    >
      <input
        type="hidden"
        name="form-name"
        value="followup"
      />
      <input
        type="text"
        name="name"
        placeholder="Your name"
        required
        style={{ padding: '8px 12px', border: '1px solid #ddd', borderRadius: '4px', fontSize: '14px' }}
      />
      <input
        type="email"
        name="email"
        placeholder="Email address"
        required
        style={{ padding: '8px 12px', border: '1px solid #ddd', borderRadius: '4px', fontSize: '14px' }}
      />
      <input
        type="tel"
        name="phone"
        placeholder="Phone (optional)"
        style={{ padding: '8px 12px', border: '1px solid #ddd', borderRadius: '4px', fontSize: '14px' }}
      />
      <select
        name="projectType"
        style={{ padding: '8px 12px', border: '1px solid #ddd', borderRadius: '4px', fontSize: '14px' }}
      >
        <option value="">Select project type</option>
        <option value="kitchen">Kitchen countertop</option>
        <option value="bathroom">Bathroom vanity</option>
        <option value="island">Island</option>
        <option value="outdoor">Outdoor bar/surface</option>
        <option value="other">Other</option>
      </select>
      <button
        type="submit"
        style={{
          padding: '10px',
          backgroundColor: '#64785f',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer',
          fontWeight: '500',
          fontSize: '14px',
        }}
      >
        Request Follow-up
      </button>
      <button
        type="button"
        onClick={() => setSelectedCTA(null)}
        style={{
          padding: '8px',
          backgroundColor: 'transparent',
          color: '#666',
          border: '1px solid #ddd',
          borderRadius: '4px',
          cursor: 'pointer',
          fontSize: '13px',
        }}
      >
        Cancel
      </button>
    </form>
  );

  const BookingForm = () => (
    <div style={{
      padding: '12px',
      backgroundColor: '#f9f9f9',
      borderRadius: '6px',
      marginTop: '12px',
      textAlign: 'center',
    }}>
      <p style={{ fontSize: '13px', color: '#666', marginBottom: '12px' }}>
        Choose a time that works for you:
      </p>
      <iframe
        src="https://calendly.com/rbgsurfaces"
        width="100%"
        height="600"
        frameBorder="0"
        title="Schedule a consultation with RBG Surfaces"
        style={{ borderRadius: '4px' }}
      />
      <button
        type="button"
        onClick={() => setSelectedCTA(null)}
        style={{
          marginTop: '12px',
          padding: '8px 12px',
          backgroundColor: 'transparent',
          color: '#666',
          border: '1px solid #ddd',
          borderRadius: '4px',
          cursor: 'pointer',
          fontSize: '13px',
        }}
      >
        Close
      </button>
    </div>
  );

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '600px',
        backgroundColor: '#ffffff',
        borderRadius: '12px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
        overflow: 'hidden',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: '16px',
          backgroundColor: '#64785f',
          color: 'white',
          borderBottom: '1px solid #e0e0e0',
        }}
      >
        <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '600' }}>
          Alex – RBG Surfaces Specialist
        </h3>
        <p style={{ margin: '4px 0 0', fontSize: '12px', opacity: 0.9 }}>
          Here to help you find the perfect countertop
        </p>
      </div>

      {/* Messages Area */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '16px',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
          backgroundColor: '#fafafa',
        }}
      >
        {messages.map(msg => (
          <div key={msg.id}>
            <div
              style={{
                display: 'flex',
                justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
              }}
            >
              <div
                style={{
                  maxWidth: '80%',
                  padding: '12px 14px',
                  borderRadius: '8px',
                  backgroundColor: msg.role === 'user' ? '#64785f' : '#e8e8e8',
                  color: msg.role === 'user' ? 'white' : '#333',
                  fontSize: '14px',
                  lineHeight: '1.4',
                }}
              >
                {msg.content}
              </div>
            </div>
          </div>
        ))}
        {loading && (
          <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
            <div style={{ padding: '12px 14px', color: '#999', fontSize: '13px' }}>
              Alex is typing...
            </div>
          </div>
        )}
        {showCTA && !selectedCTA && <CTAButtons />}
        {selectedCTA === 'estimate' && <EstimateForm />}
        {selectedCTA === 'followup' && <FollowupForm />}
        {selectedCTA === 'book' && <BookingForm />}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div
        style={{
          padding: '12px',
          borderTop: '1px solid #e0e0e0',
          backgroundColor: '#ffffff',
          display: 'flex',
          gap: '8px',
        }}
      >
        <input
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyPress={e => e.key === 'Enter' && handleSendMessage()}
          placeholder="Ask about materials, design, installation..."
          disabled={loading}
          style={{
            flex: 1,
            padding: '10px 12px',
            border: '1px solid #d0d0d0',
            borderRadius: '6px',
            fontSize: '14px',
            fontFamily: 'inherit',
            outline: 'none',
            backgroundColor: loading ? '#f5f5f5' : 'white',
          }}
        />
        <button
          onClick={handleSendMessage}
          disabled={loading || !input.trim()}
          style={{
            padding: '10px 14px',
            backgroundColor: loading || !input.trim() ? '#ccc' : '#64785f',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: loading || !input.trim() ? 'not-allowed' : 'pointer',
            fontWeight: '500',
            fontSize: '14px',
          }}
        >
          Send
        </button>
      </div>
    </div>
  );
};

export default AlexWidget;
