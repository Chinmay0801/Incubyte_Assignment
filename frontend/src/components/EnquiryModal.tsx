import { useState, type FormEvent } from 'react';
import type { Vehicle } from '../types';
import { Modal } from './Modal';
import { formatPrice } from '../utils/format';
import { DEALERSHIP_CONTACT } from '../data/dealershipContact';

interface EnquiryModalProps {
  vehicle?: Vehicle | null;
  onClose: () => void;
  onSuccess: (message: string) => void;
}

export function EnquiryModal({ vehicle, onClose, onSuccess }: EnquiryModalProps) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState(
    vehicle
      ? `Hi Chinmay, I am interested in purchasing or booking a test drive for the ${vehicle.make} ${vehicle.model} (${formatPrice(vehicle.price)}).`
      : 'Hi Chinmay, I would like more information on the available vehicle inventory and financing options.',
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  const vehicleTitle = vehicle ? `${vehicle.make} ${vehicle.model}` : 'Vehicle Inquiry';
  const waText = encodeURIComponent(
    `Hello Chinmay, I am inquiring about ${vehicle ? `the ${vehicle.make} ${vehicle.model} (${formatPrice(vehicle.price)})` : 'vehicles in Lotline inventory'}. My name is ${name || '[Customer]'}.`,
  );
  const waUrl = `https://wa.me/91${DEALERSHIP_CONTACT.phone}?text=${waText}`;

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim()) return;

    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      onSuccess(`Thank you ${name.trim()}! Chinmay has received your enquiry and will call you at ${phone.trim()} shortly.`);
      onClose();
    }, 400);
  };

  return (
    <Modal title={`Enquire: ${vehicleTitle}`} onClose={onClose}>
      <div className="space-y-4">
        {/* Contact person banner */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 rounded-md border border-asphalt-700 bg-asphalt-900/90 p-3.5">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-asphalt-100">{DEALERSHIP_CONTACT.name}</span>
              <span className="rounded bg-paint/20 px-1.5 py-0.5 text-[10px] font-bold text-paint uppercase">Official Advisor</span>
            </div>
            <p className="text-xs text-asphalt-400 mt-0.5">{DEALERSHIP_CONTACT.role}</p>
          </div>
          <div className="flex items-center gap-2">
            <a
              href={waUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-sm bg-emerald-600 px-2.5 py-1 text-xs font-bold text-white hover:bg-emerald-500 transition-colors"
              title="Chat directly with Chinmay on WhatsApp"
            >
              <span>💬 WhatsApp</span>
            </a>
            <a
              href={`tel:+91${DEALERSHIP_CONTACT.phone}`}
              className="inline-flex items-center gap-1.5 rounded-sm border border-asphalt-600 bg-asphalt-800 px-2.5 py-1 text-xs font-medium text-asphalt-200 hover:border-paint hover:text-paint transition-colors"
            >
              <span>📞 Call</span>
            </a>
          </div>
        </div>

        {/* Quick details */}
        <div className="grid grid-cols-2 gap-2 text-xs text-asphalt-300 rounded-md bg-asphalt-950/50 p-2.5 border border-asphalt-800">
          <div>
            <span className="text-asphalt-500 block">Phone:</span>
            <a href={`tel:+91${DEALERSHIP_CONTACT.phone}`} className="hover:text-paint font-mono font-medium">
              {DEALERSHIP_CONTACT.phoneDisplay}
            </a>
          </div>
          <div>
            <span className="text-asphalt-500 block">Email:</span>
            <a href={`mailto:${DEALERSHIP_CONTACT.email}`} className="hover:text-paint font-mono font-medium truncate block">
              {DEALERSHIP_CONTACT.email}
            </a>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-3 pt-1">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label htmlFor="enquiry-name" className="field-label">Your Name *</label>
              <input
                id="enquiry-name"
                required
                className="field-input"
                placeholder="e.g. Rahul Sharma"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="enquiry-phone" className="field-label">Mobile Number *</label>
              <input
                id="enquiry-phone"
                required
                type="tel"
                className="field-input"
                placeholder="e.g. 9876543210"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label htmlFor="enquiry-email" className="field-label">Email (Optional)</label>
            <input
              id="enquiry-email"
              type="email"
              className="field-input"
              placeholder="e.g. rahul@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div>
            <label htmlFor="enquiry-message" className="field-label">Message / Request Details</label>
            <textarea
              id="enquiry-message"
              rows={3}
              className="field-input resize-none"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button type="button" className="btn-ghost" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={isSubmitting}>
              {isSubmitting ? 'Sending...' : 'Send Enquiry to Chinmay'}
            </button>
          </div>
        </form>
      </div>
    </Modal>
  );
}
