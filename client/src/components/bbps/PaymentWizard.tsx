import React, { useState } from 'react';
import { useFetchBill, usePayBill } from '../../hooks/useBBPS';
import { AlertCircle, CheckCircle2, Loader2, ArrowLeft, Receipt, ShieldCheck } from 'lucide-react';
import axios from 'axios';
import { API_BASE_URL } from '../../api/client';

interface PaymentWizardProps {
  biller: any;
  sessionId: string;
  onBack: () => void;
}

export default function PaymentWizard({ biller, sessionId, onBack }: PaymentWizardProps) {
  const [step, setStep] = useState<'ENTER_DETAILS' | 'FETCHING' | 'BILL_SUMMARY' | 'PROCESSING' | 'SUCCESS' | 'FAILED'>('ENTER_DETAILS');
  const [consumerNumber, setConsumerNumber] = useState('');
  const [billDetails, setBillDetails] = useState<any>(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [txDetails, setTxDetails] = useState<any>(null);

  const fetchBillMutation = useFetchBill();
  const payBillMutation = usePayBill();

  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      if ((window as any).Razorpay) {
        resolve(true);
        return;
      }
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handleFetch = async () => {
    setErrorMsg('');
    const regex = new RegExp(biller.consumerRegex);
    if (!regex.test(consumerNumber)) {
      setErrorMsg(`Invalid format. Example: ${biller.sampleIds[0]}`);
      return;
    }
    
    setStep('FETCHING');
    try {
      const bill = await fetchBillMutation.mutateAsync({ billerId: biller.billerId, consumerNumber });
      if (bill.status === 'NOT_FOUND') {
        setErrorMsg('Consumer number not found with the provider.');
        setStep('ENTER_DETAILS');
      } else {
        setBillDetails(bill);
        setStep('BILL_SUMMARY');
      }
    } catch (err: any) {
      setErrorMsg('Failed to fetch bill. Try again.');
      setStep('ENTER_DETAILS');
    }
  };

  const handlePay = async () => {
    setStep('PROCESSING');
    try {
      const isScriptLoaded = await loadRazorpayScript();
      if (!isScriptLoaded) {
        setErrorMsg('Failed to load payment gateway script.');
        setStep('BILL_SUMMARY');
        return;
      }

      const { data: orderData } = await axios.post(`${API_BASE_URL}/api/bbps/pay/order`, {
        userId: sessionId,
        billId: billDetails.billId,
        billerId: biller.billerId,
        amount: billDetails.amount
      });

      if (orderData.sandbox) {
        console.log('Running in Developer Sandbox Payment Mode');
        const verifyRes = await axios.post(`${API_BASE_URL}/api/bbps/pay/verify`, {
          userId: sessionId,
          billId: billDetails.billId,
          billerId: biller.billerId,
          amount: billDetails.amount,
          razorpay_order_id: orderData.orderId,
          razorpay_payment_id: 'pay_sandbox_' + Date.now(),
          razorpay_signature: 'sandbox_signature'
        });

        setTxDetails(verifyRes.data);
        setStep('SUCCESS');
        return;
      }

      const options = {
        key: orderData.key,
        amount: orderData.amount * 100,
        currency: 'INR',
        name: biller.name,
        description: `Bill Payment for ${biller.name}`,
        order_id: orderData.orderId,
        handler: async function (response: any) {
          setStep('PROCESSING');
          try {
            const verifyRes = await axios.post(`${API_BASE_URL}/api/bbps/pay/verify`, {
              userId: sessionId,
              billId: billDetails.billId,
              billerId: biller.billerId,
              amount: billDetails.amount,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature
            });

            setTxDetails(verifyRes.data);
            setStep('SUCCESS');
          } catch (verifyErr: any) {
            setTxDetails({ message: verifyErr.response?.data?.error || 'Payment signature verification failed' });
            setStep('FAILED');
          }
        },
        modal: {
          ondismiss: function () {
            setStep('BILL_SUMMARY');
          }
        },
        prefill: {
          name: billDetails.customerName
        },
        theme: {
          color: '#2D213F'
        }
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.open();
    } catch (err: any) {
      setTxDetails({ message: err.response?.data?.error || err.message || 'Payment initiation failed' });
      setStep('FAILED');
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-premium border border-surface-200 overflow-hidden max-w-2xl mx-auto">
      <div className="bg-[#2D213F] p-5 flex items-center gap-4 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 p-4 opacity-5">
          <ShieldCheck className="w-32 h-32" />
        </div>
        <button onClick={onBack} className="p-2 hover:bg-white/10 rounded-full transition relative z-10">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center text-3xl shadow-inner relative z-10">
          {biller.logo}
        </div>
        <div className="relative z-10">
          <h2 className="font-bold text-lg">{biller.name}</h2>
          <p className="text-xs text-white/70 font-medium tracking-wide uppercase">{biller.category}</p>
        </div>
      </div>

      <div className="p-6 md:p-10">
        {step === 'ENTER_DETAILS' && (
          <div className="space-y-6 max-w-md mx-auto">
            <div>
              <label className="block text-xs font-bold text-[#4B5563] uppercase tracking-wider mb-2">Consumer Number / ID</label>
              <input 
                type="text" 
                value={consumerNumber}
                onChange={e => setConsumerNumber(e.target.value)}
                placeholder={`e.g. ${biller.sampleIds[0]}`}
                className="w-full px-4 py-3.5 bg-surface-50 border border-surface-200 rounded-xl focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none uppercase font-medium text-[#111827] placeholder:text-surface-400 transition-all"
              />
              {errorMsg && (
                <div className="mt-3 flex items-start gap-2 text-danger-600 bg-danger-50 p-3 rounded-lg text-sm">
                  <AlertCircle className="w-5 h-5 shrink-0" />
                  <span className="font-medium">{errorMsg}</span>
                </div>
              )}
            </div>
            <button 
              onClick={handleFetch}
              disabled={!consumerNumber}
              className="w-full bg-primary-600 hover:bg-primary-700 disabled:opacity-50 text-white font-bold py-3.5 rounded-xl transition-all shadow-sm flex items-center justify-center gap-2"
            >
              Fetch Bill Details
            </button>
            <div className="text-center">
              <span className="inline-flex items-center gap-1.5 text-xs font-medium text-[#6B7280] bg-surface-100 px-3 py-1.5 rounded-full">
                <ShieldCheck className="w-4 h-4 text-primary-500" /> BBPS Secure Fetch
              </span>
            </div>
          </div>
        )}

        {step === 'FETCHING' && (
          <div className="flex flex-col items-center justify-center py-16 text-[#6B7280] space-y-5">
            <div className="w-12 h-12 border-4 border-surface-200 border-t-primary-600 rounded-full animate-spin"></div>
            <p className="font-semibold text-[#111827] animate-pulse">Connecting to Biller...</p>
          </div>
        )}

        {step === 'BILL_SUMMARY' && billDetails && (
          <div className="max-w-md mx-auto space-y-6">
            <div className="bg-surface-50 p-6 rounded-2xl border border-surface-200 shadow-sm relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary-400 to-accent-500"></div>
              
              <div className="flex justify-between items-start mb-6">
                <div>
                  <p className="text-[10px] font-bold text-[#6B7280] uppercase tracking-wider mb-1">Consumer Name</p>
                  <p className="font-bold text-[#111827] text-lg">{billDetails.customerName}</p>
                </div>
                {billDetails.status === 'PAID' ? (
                  <span className="px-3 py-1 bg-success-100 text-success-700 rounded-full text-[10px] font-bold uppercase tracking-widest border border-success-200">Paid</span>
                ) : (
                  <span className="px-3 py-1 bg-warning-100 text-warning-700 rounded-full text-[10px] font-bold uppercase tracking-widest border border-warning-200">Unpaid</span>
                )}
              </div>
              
              <div className="space-y-4 text-sm bg-white p-4 rounded-xl border border-surface-100">
                <div className="flex justify-between items-center border-b border-surface-100 pb-3">
                  <span className="text-[#6B7280] font-medium">Bill Period</span>
                  <span className="font-bold text-[#111827]">{billDetails.billPeriod || 'Current Month'}</span>
                </div>
                <div className="flex justify-between items-center border-b border-surface-100 pb-3">
                  <span className="text-[#6B7280] font-medium">Due Date</span>
                  <span className="font-bold text-danger-600">{new Date(billDetails.dueDate).toLocaleDateString()}</span>
                </div>
                <div className="flex justify-between items-center pt-1">
                  <span className="text-[#4B5563] font-bold">Total Due</span>
                  <span className="font-display font-bold text-3xl text-primary-700">₹{billDetails.amount}</span>
                </div>
              </div>
            </div>

            {billDetails.status === 'UNPAID' ? (
              <button 
                onClick={handlePay}
                className="w-full bg-primary-600 hover:bg-primary-700 text-white font-bold py-4 rounded-xl shadow-premium-hover transition-all text-lg flex items-center justify-center gap-2"
              >
                <ShieldCheck className="w-5 h-5" /> Pay ₹{billDetails.amount} Securely
              </button>
            ) : (
              <button 
                onClick={onBack}
                className="w-full bg-surface-100 hover:bg-surface-200 text-[#111827] font-bold py-3.5 rounded-xl transition-colors"
              >
                Go Back
              </button>
            )}
          </div>
        )}

        {step === 'PROCESSING' && (
          <div className="flex flex-col items-center justify-center py-16 text-[#6B7280] space-y-6">
            <div className="relative">
              <div className="w-20 h-20 border-4 border-surface-100 border-t-primary-600 rounded-full animate-spin"></div>
              <div className="absolute inset-0 flex items-center justify-center text-2xl font-bold text-primary-600">
                ₹
              </div>
            </div>
            <div className="text-center">
              <p className="font-bold text-xl text-[#111827] mb-2">Processing Payment...</p>
              <p className="text-sm font-medium">Please do not close or refresh this window</p>
            </div>
          </div>
        )}

        {step === 'SUCCESS' && (
          <div className="flex flex-col items-center justify-center py-8 text-center space-y-5">
            <div className="w-20 h-20 bg-success-100 text-success-600 rounded-full flex items-center justify-center mb-2 shadow-sm ring-4 ring-success-50">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <h3 className="text-3xl font-display font-bold text-[#111827]">Payment Successful!</h3>
            <p className="text-[#6B7280] max-w-sm font-medium leading-relaxed">
              Your payment of <strong className="text-[#111827]">₹{billDetails?.amount}</strong> to {biller.name} was completed.
            </p>
            <div className="bg-surface-50 w-full max-w-sm p-5 rounded-2xl text-sm text-left border border-surface-200 mt-4 space-y-3">
              <div className="flex justify-between items-center"><span className="text-[#6B7280] font-medium">Txn ID:</span> <span className="font-mono font-bold text-[#111827]">{txDetails?.transactionId}</span></div>
              <div className="flex justify-between items-center"><span className="text-[#6B7280] font-medium">BBPS Ref:</span> <span className="font-mono font-bold text-[#111827]">{txDetails?.referenceId}</span></div>
            </div>
            <div className="flex gap-4 w-full max-w-sm mt-6">
              <a 
                href={`${API_BASE_URL}/api/bbps/receipt/${txDetails?.transactionId}`}
                target="_blank"
                className="flex-1 bg-white border-2 border-primary-100 hover:border-primary-600 text-primary-700 font-bold py-3.5 rounded-xl flex justify-center items-center gap-2 transition-colors"
              >
                <Receipt className="w-5 h-5" /> Receipt
              </a>
              <button 
                onClick={onBack}
                className="flex-1 bg-primary-600 hover:bg-primary-700 text-white font-bold py-3.5 rounded-xl transition-colors shadow-sm"
              >
                Done
              </button>
            </div>
          </div>
        )}

        {step === 'FAILED' && (
          <div className="flex flex-col items-center justify-center py-10 text-center space-y-5">
            <div className="w-20 h-20 bg-danger-100 text-danger-600 rounded-full flex items-center justify-center mb-2 ring-4 ring-danger-50">
              <AlertCircle className="w-10 h-10" />
            </div>
            <h3 className="text-3xl font-display font-bold text-[#111827]">Payment Failed</h3>
            <p className="text-[#6B7280] max-w-sm font-medium">
              {txDetails?.message || 'We could not process your payment at this time.'}
            </p>
            <button 
              onClick={() => setStep('BILL_SUMMARY')}
              className="mt-6 bg-primary-600 text-white font-bold px-8 py-3.5 rounded-xl hover:bg-primary-700 transition-colors shadow-sm"
            >
              Try Again
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
