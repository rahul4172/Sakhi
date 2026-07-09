import React, { useState } from 'react';
import FadeContent from './ui/FadeContent';
import { HelpCircle, MessageSquare, PhoneCall, Mail, ChevronDown, ChevronUp, ExternalLink } from 'lucide-react';

export default function HelpSupport() {
  const [openFaq, setOpenFaq] = useState(0);

  const faqs = [
    {
      q: "How is my SakhiScore calculated?",
      a: "Your SakhiScore is based on your savings consistency, bill payment punctuality, income stability, and SHG repayment history. Consistently logging your income and paying bills via the BBPS portal will steadily increase your score."
    },
    {
      q: "Are my documents safe here?",
      a: "Yes, SakhiCredit uses 256-bit bank-level encryption. Your documents are stored securely and are only shared with partner banks when you explicitly apply for a scheme."
    },
    {
      q: "What if I miss a bill payment?",
      a: "Missing a single bill payment might slightly lower your score temporarily, but getting back on track quickly will restore it. We recommend setting up auto-pay or calendar reminders."
    },
    {
      q: "How do I apply for a loan scheme?",
      a: "Navigate to 'Loan Matches' on the sidebar. If your score meets the minimum requirement, you will see a 'View Details' button where you can initiate the application process directly with the provider."
    }
  ];

  return (
    <FadeContent className="max-w-[1200px] mx-auto pb-12 space-y-8">
      <div>
        <h2 className="text-2xl font-display font-bold text-[#111827]">Help & Support</h2>
        <p className="text-sm text-[#6B7280] mt-1">We're here to help you navigate your financial journey.</p>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        
        {/* Contact Methods */}
        <div className="lg:col-span-1 space-y-6">
          <div className="premium-card p-6 flex flex-col gap-4">
            <h3 className="font-bold text-[#111827] mb-2">Get in touch</h3>
            
            <a href="tel:18001234567" className="flex items-center gap-3 p-3 rounded-xl hover:bg-surface-50 transition-colors border border-transparent hover:border-surface-200">
              <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center flex-shrink-0">
                <PhoneCall className="w-4 h-4" />
              </div>
              <div>
                <p className="text-sm font-bold text-[#111827]">Toll-Free Helpline</p>
                <p className="text-xs text-[#6B7280]">1800-123-4567</p>
              </div>
            </a>
            
            <a href="mailto:support@sakhicredit.in" className="flex items-center gap-3 p-3 rounded-xl hover:bg-surface-50 transition-colors border border-transparent hover:border-surface-200">
              <div className="w-10 h-10 bg-pink-50 text-pink-600 rounded-full flex items-center justify-center flex-shrink-0">
                <Mail className="w-4 h-4" />
              </div>
              <div>
                <p className="text-sm font-bold text-[#111827]">Email Us</p>
                <p className="text-xs text-[#6B7280]">support@sakhicredit.in</p>
              </div>
            </a>
            
            <button className="flex items-center gap-3 p-3 rounded-xl hover:bg-surface-50 transition-colors border border-transparent hover:border-surface-200 text-left w-full">
              <div className="w-10 h-10 bg-teal-50 text-teal-600 rounded-full flex items-center justify-center flex-shrink-0">
                <MessageSquare className="w-4 h-4" />
              </div>
              <div>
                <p className="text-sm font-bold text-[#111827]">Live Chat</p>
                <p className="text-xs text-[#6B7280]">Usually responds in 5 mins</p>
              </div>
            </button>
          </div>
          
          <div className="premium-card p-6 bg-[#2D213F] text-white">
            <h3 className="font-bold mb-2 flex items-center gap-2"><HelpCircle className="w-5 h-5 text-primary-300"/> Community Forum</h3>
            <p className="text-sm text-white/70 mb-4">Join thousands of women discussing business ideas, savings tips, and sharing experiences.</p>
            <button className="bg-white/10 hover:bg-white/20 border border-white/20 px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2 w-full">
              Join the Community <ExternalLink className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* FAQs */}
        <div className="lg:col-span-2">
          <div className="premium-card p-6">
            <h3 className="font-bold text-[#111827] mb-6 text-lg">Frequently Asked Questions</h3>
            <div className="space-y-4">
              {faqs.map((faq, index) => (
                <div key={index} className="border border-surface-200 rounded-xl overflow-hidden transition-all duration-200">
                  <button 
                    onClick={() => setOpenFaq(openFaq === index ? -1 : index)}
                    className="w-full text-left px-5 py-4 flex items-center justify-between bg-white hover:bg-surface-50 transition-colors"
                  >
                    <span className="font-semibold text-sm text-[#111827]">{faq.q}</span>
                    {openFaq === index ? (
                      <ChevronUp className="w-4 h-4 text-[#6B7280] flex-shrink-0" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-[#6B7280] flex-shrink-0" />
                    )}
                  </button>
                  {openFaq === index && (
                    <div className="px-5 pb-5 pt-1 text-sm text-[#4B5563] leading-relaxed bg-white border-t border-surface-100">
                      {faq.a}
                    </div>
                  )}
                </div>
              ))}
            </div>
            
            <div className="mt-8 p-4 bg-primary-50 rounded-xl flex items-center gap-4 border border-primary-100">
              <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center flex-shrink-0 text-primary-600 shadow-sm">
                <MessageSquare className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-primary-900 text-sm">Still have questions?</h4>
                <p className="text-xs text-primary-700 mt-1">Our AI Assistant Sakhi is available 24/7 to answer your queries in your local language.</p>
              </div>
            </div>
          </div>
        </div>

      </div>
    </FadeContent>
  );
}
