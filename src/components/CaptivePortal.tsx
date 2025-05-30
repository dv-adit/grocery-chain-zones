import React from 'react';

interface CaptivePortalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (name: string, email: string) => void;
}

const CaptivePortal: React.FC<CaptivePortalProps> = ({ isOpen, onClose, onSubmit }) => {
  const [name, setName] = React.useState('');
  const [email, setEmail] = React.useState('');
  const [emailError, setEmailError] = React.useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Simple email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setEmailError('Please enter a valid email address');
      return;
    }
    
    onSubmit(name, email);
    onClose();
  };

  return (
    <div className="captive-portal">
      <div className="iphone-frame">
        <div className="iphone-notch"></div>
        <div className="portal-content">
          <button 
            className="close-button"
            onClick={onClose}
            aria-label="Close"
          >
            ×
          </button>
          <h2 className="text-2xl font-bold mb-6 text-center">Welcome!</h2>
          <p className="mb-6 text-center">
            Sign up to receive exclusive offers and updates.
          </p>
          
          <form className="portal-form" onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="name">Name</label>
              <input 
                type="text" 
                id="name" 
                placeholder="Enter your name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="email">Email</label>
              <input 
                type="email" 
                id="email" 
                placeholder="Enter your email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setEmailError('');
                }}
                required
                className={emailError ? 'border-red-500' : ''}
              />
              {emailError && (
                <p className="text-red-500 text-xs mt-1">{emailError}</p>
              )}
            </div>
            
            <button 
              type="submit"
              className="submit-button"
            >
              Submit
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CaptivePortal;
