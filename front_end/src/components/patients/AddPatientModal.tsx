import React, { useState } from 'react';
import { User, X } from 'lucide-react';

export interface AddPatientModalProps {
  onClose: () => void;
  onSubmit: (name: string, age: number, gender: string) => Promise<void>;
  addLoading: boolean;
  addError: string;
}

export const AddPatientModal: React.FC<AddPatientModalProps> = ({
  onClose,
  onSubmit,
  addLoading,
  addError,
}) => {
  const [newName, setNewName] = useState('');
  const [newAge, setNewAge] = useState('');
  const [newGender, setNewGender] = useState('Male');
  const [validationError, setValidationError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError('');

    if (!newName.trim() || !newAge.trim() || !newGender) {
      setValidationError('Please fill in all fields.');
      return;
    }

    const ageNum = parseInt(newAge);
    if (isNaN(ageNum) || ageNum <= 0 || ageNum > 120) {
      setValidationError('Please enter a valid age between 1 and 120.');
      return;
    }

    try {
      await onSubmit(newName.trim(), ageNum, newGender);
    } catch {}
  };

  return (
    <div style={{
      position: 'fixed', inset: 0,
      background: 'rgba(0, 0, 0, 0.65)',
      backdropFilter: 'blur(10px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 1000,
      animation: 'fadeIn 0.25s ease forwards'
    }}>
      <div className="card" style={{
        width: '100%', maxWidth: 440,
        padding: '2rem',
        border: '1px solid rgba(255,255,255,0.08)',
        boxShadow: '0 24px 64px -16px rgba(0,0,0,0.7)',
        position: 'relative',
        animation: 'scaleUp 0.3s cubic-bezier(0.34, 1.56, 0.64, 1) forwards'
      }}>
        {/* Close */}
        <button 
          onClick={onClose}
          style={{
            position: 'absolute', right: 20, top: 20,
            background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)',
            borderRadius: '50%', color: 'var(--text-muted)',
            width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', transition: 'all 0.2s'
          }}
          onMouseEnter={e => { e.currentTarget.style.color = '#fff'; e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; }}
          onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; }}
        >
          <X size={14} />
        </button>

        <h3 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: 8 }}>
          <User size={18} color="var(--teal)" /> Patient Registration
        </h3>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="form-group">
            <label className="form-label">Full Name</label>
            <input 
              type="text" 
              className="form-input" 
              placeholder="e.g. Martha Robinson" 
              value={newName}
              onChange={e => setNewName(e.target.value)}
              required
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div className="form-group">
              <label className="form-label">Age</label>
              <input 
                type="number" 
                className="form-input" 
                placeholder="e.g. 64" 
                value={newAge}
                onChange={e => setNewAge(e.target.value)}
                required
              />
            </div>
            
            <div className="form-group">
              <label className="form-label">Gender</label>
              <select 
                className="form-select" 
                value={newGender}
                onChange={e => setNewGender(e.target.value)}
              >
                <option value="Male">Male</option>
                <option value="Female">Female</option>
              </select>
            </div>
          </div>

          {(addError || validationError) && (
            <div style={{
              background: 'rgba(255,107,107,0.08)',
              border: '1px solid rgba(255,107,107,0.2)',
              color: 'var(--coral)',
              borderRadius: 8,
              padding: '8px 12px',
              fontSize: '0.78rem',
              fontWeight: 600
            }}>
              {validationError || addError}
            </div>
          )}

          <button 
            type="submit" 
            className="btn-primary" 
            disabled={addLoading}
            style={{ 
              marginTop: 10, 
              justifyContent: 'center', 
              padding: '12px 0',
              background: 'linear-gradient(135deg, var(--teal), var(--blue))',
              border: 'none',
              boxShadow: '0 4px 15px -4px rgba(0,201,177,0.4)',
              fontWeight: 700
            }}
          >
            {addLoading ? 'Registering...' : 'Complete Registration'}
          </button>
        </form>
      </div>
    </div>
  );
};
