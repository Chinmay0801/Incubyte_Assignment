import { useState, type FormEvent } from 'react';
import { Link } from 'react-router';
import { DEALERSHIP_CONTACT } from '../data/dealershipContact';

export function ContactHelpPage() {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [topic, setTopic] = useState('general');
  const [message, setMessage] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim() || !message.trim()) return;
    setSubmitted(true);
  };

  const waUrl = `https://wa.me/91${DEALERSHIP_CONTACT.phone}?text=${encodeURIComponent(
    'Hello Chinmay, I would like assistance with vehicle purchases at Lotline Dealership.',
  )}`;

  return (
    <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      {/* Back button and page title */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <Link to="/" className="text-xs font-mono text-paint hover:underline">
            ← Back to Inventory Lot
          </Link>
          <h1 className="font-display text-3xl sm:text-4xl font-black uppercase tracking-tight text-white mt-1">
            Help & Customer Support
          </h1>
          <p className="text-sm text-asphalt-300 mt-1">
            Direct assistance, test drive bookings, financing guidance, and dealer inquiries.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Contact Advisor Card */}
        <div className="space-y-6">
          <div className="rounded-lg border border-asphalt-700 bg-asphalt-900/90 p-5 shadow-xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-paint/20 border border-paint text-xl font-display font-black text-paint">
                C
              </div>
              <div>
                <h2 className="font-semibold text-lg text-white">{DEALERSHIP_CONTACT.name}</h2>
                <p className="text-xs text-asphalt-400">{DEALERSHIP_CONTACT.role}</p>
                <span className="inline-block rounded bg-emerald-500/20 px-2 py-0.5 text-[10px] font-bold text-emerald-400 mt-1 uppercase">
                  ● Available for Support
                </span>
              </div>
            </div>

            <div className="space-y-3 border-t border-asphalt-800 pt-4 text-xs">
              <div>
                <span className="text-asphalt-400 block font-mono">Mobile / Direct Phone</span>
                <a
                  href={`tel:+91${DEALERSHIP_CONTACT.phone}`}
                  className="text-white hover:text-paint font-mono text-sm font-semibold tracking-wide"
                >
                  {DEALERSHIP_CONTACT.phoneDisplay}
                </a>
              </div>

              <div>
                <span className="text-asphalt-400 block font-mono">Official Email</span>
                <a
                  href={`mailto:${DEALERSHIP_CONTACT.email}`}
                  className="text-white hover:text-paint font-mono text-sm font-semibold truncate block"
                >
                  {DEALERSHIP_CONTACT.email}
                </a>
              </div>

              <div>
                <span className="text-asphalt-400 block font-mono">Working Hours</span>
                <span className="text-asphalt-200 block">{DEALERSHIP_CONTACT.hours}</span>
              </div>

              <div>
                <span className="text-asphalt-400 block font-mono">Dealership Location</span>
                <span className="text-asphalt-200 block leading-relaxed">{DEALERSHIP_CONTACT.location}</span>
              </div>
            </div>

            {/* Quick Action buttons */}
            <div className="mt-5 space-y-2">
              <a
                href={waUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex w-full items-center justify-center gap-2 rounded-md bg-emerald-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-emerald-500 transition-colors shadow-md"
              >
                <span>💬 Chat on WhatsApp</span>
              </a>
              <a
                href={`tel:+91${DEALERSHIP_CONTACT.phone}`}
                className="flex w-full items-center justify-center gap-2 rounded-md border border-asphalt-600 bg-asphalt-800 px-4 py-2 text-sm font-medium text-asphalt-100 hover:border-paint hover:text-paint transition-colors"
              >
                <span>📞 Call Chinmay</span>
              </a>
            </div>
          </div>

          {/* Quick Info Box */}
          <div className="rounded-lg border border-asphalt-700 bg-asphalt-900/60 p-4 text-xs text-asphalt-300 space-y-2">
            <h3 className="font-semibold text-white uppercase tracking-wider text-[11px] font-mono">
              Dealership Guarantees
            </h3>
            <ul className="space-y-1.5 list-disc list-inside text-asphalt-400">
              <li>100% Genuine OEM manufacturer warranty</li>
              <li>Transparent INR pricing with zero hidden handling fees</li>
              <li>Doorstep test drive & express RTO registration</li>
            </ul>
          </div>
        </div>

        {/* Support & Enquiry Form */}
        <div className="lg:col-span-2 space-y-6">
          <div className="rounded-lg border border-asphalt-700 bg-asphalt-900/80 p-6 shadow-xl">
            <h2 className="font-display text-xl sm:text-2xl font-black uppercase text-white mb-1">
              Send an Enquiry or Service Request
            </h2>
            <p className="text-xs text-asphalt-400 mb-5">
              Fill out the form below and Chinmay will review your inquiry and follow up within 2 business hours.
            </p>

            {submitted ? (
              <div className="rounded-md border border-emerald-600/60 bg-emerald-950/40 p-6 text-center">
                <div className="text-3xl mb-2">✅</div>
                <h3 className="font-display text-xl font-bold text-white uppercase">Enquiry Received!</h3>
                <p className="text-sm text-asphalt-300 mt-2 max-w-md mx-auto">
                  Thank you <strong className="text-white">{name}</strong>. Chinmay has received your message regarding{' '}
                  <span className="text-paint">{topic}</span> and will call you at{' '}
                  <strong className="text-white">{phone}</strong> shortly.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setSubmitted(false);
                    setMessage('');
                  }}
                  className="btn-ghost mt-4 text-xs"
                >
                  Send another inquiry
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="contact-name" className="field-label">Full Name *</label>
                    <input
                      id="contact-name"
                      required
                      className="field-input"
                      placeholder="e.g. Vikramaditya Rathore"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                    />
                  </div>
                  <div>
                    <label htmlFor="contact-phone" className="field-label">Phone Number *</label>
                    <input
                      id="contact-phone"
                      required
                      type="tel"
                      className="field-input"
                      placeholder="e.g. 9876543210"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="contact-email" className="field-label">Email Address (Optional)</label>
                    <input
                      id="contact-email"
                      type="email"
                      className="field-input"
                      placeholder="e.g. vikram@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>
                  <div>
                    <label htmlFor="contact-topic" className="field-label">Inquiry Category</label>
                    <select
                      id="contact-topic"
                      className="field-input"
                      value={topic}
                      onChange={(e) => setTopic(e.target.value)}
                    >
                      <option value="Vehicle Purchase">New Vehicle Purchase</option>
                      <option value="Test Drive Booking">Book Doorstep Test Drive</option>
                      <option value="Financing & Loan">Vehicle Loan / EMI Financing</option>
                      <option value="RTO Registration">RTO Registration & Insurance</option>
                      <option value="Corporate / Bulk Order">Corporate / Bulk Inquiries</option>
                      <option value="General Support">General Support</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label htmlFor="contact-message" className="field-label">Detailed Message *</label>
                  <textarea
                    id="contact-message"
                    required
                    rows={4}
                    className="field-input resize-none"
                    placeholder="Provide details about the car model you are interested in, your preferred test drive dates, or your financing requirements..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                  />
                </div>

                <div className="flex justify-end pt-2">
                  <button type="submit" className="btn-primary w-full sm:w-auto">
                    Submit Message to Chinmay
                  </button>
                </div>
              </form>
            )}
          </div>

          {/* Frequently Asked Questions */}
          <div className="rounded-lg border border-asphalt-700 bg-asphalt-900/60 p-5 space-y-3">
            <h3 className="font-display text-lg font-bold uppercase text-white tracking-wide">
              Frequently Asked Questions (FAQ)
            </h3>
            <div className="space-y-3 text-xs text-asphalt-300">
              <div className="rounded border border-asphalt-800 bg-asphalt-950/60 p-3">
                <h4 className="font-semibold text-paint mb-1">How does vehicle purchasing work on Lotline?</h4>
                <p className="text-asphalt-400">
                  When you click &ldquo;Purchase&rdquo; on any in-stock vehicle, your unit is atomically reserved from the dealer lot and an official order receipt is generated in &ldquo;My Purchases&rdquo;. Our team then coordinates delivery and documentation.
                </p>
              </div>
              <div className="rounded border border-asphalt-800 bg-asphalt-950/60 p-3">
                <h4 className="font-semibold text-paint mb-1">What financing or payment modes are accepted?</h4>
                <p className="text-asphalt-400">
                  We accept RTGS, NEFT, direct wire transfer, and partner with top Indian banks (HDFC, SBI, ICICI, Axis) for up to 90% on-road financing with competitive interest rates.
                </p>
              </div>
              <div className="rounded border border-asphalt-800 bg-asphalt-950/60 p-3">
                <h4 className="font-semibold text-paint mb-1">Can I schedule a home test drive?</h4>
                <p className="text-asphalt-400">
                  Yes! Message Chinmay on WhatsApp (+91 90000 00000) with your location and preferred vehicle to schedule a doorstep test drive across Mumbai and MMR regions.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
