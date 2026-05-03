import React, { useState } from 'react'
import { contactAPI } from '../api'
import { Input, Textarea, Btn } from '../components/ui'
import toast from 'react-hot-toast'
import './Contact.css'

export default function Contact() {
  const [form, setForm] = useState({ name:'', email:'', subject:'', message:'' })
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)
  const set = (k,v) => setForm(f=>({...f,[k]:v}))

  const submit = async (e) => {
    e.preventDefault(); setSending(true)
    try {
      await contactAPI.send(form)
      setSent(true); toast.success('Message sent! We\'ll get back to you soon.')
    } catch { toast.error('Could not send message, please try again.') }
    finally { setSending(false) }
  }

  return (
    <div>
      <div className="page-hero">
        <div className="container"><h1>Get in Touch</h1><p>We're here to help with any questions about EventFlow.</p></div>
      </div>
      <div className="container">
        <div className="contact-layout">
          <div>
            <h2>Contact Us</h2>
            <p className="contact-intro">Have a question, feedback, or need help? Fill in the form and our team will respond within 24 hours.</p>
            <div className="contact-methods">
              {[
                {icon:'📧',title:'Email',val:'support@eventflow.in'},
                {icon:'📞',title:'Phone',val:'+91 99999 00000'},
                {icon:'📍',title:'Office',val:'BKC, Mumbai, Maharashtra 400051'},
                {icon:'🕐',title:'Hours',val:'Mon–Fri, 9 AM – 6 PM IST'},
              ].map(m=>(
                <div key={m.title} className="contact-method">
                  <div className="cm-icon">{m.icon}</div>
                  <div><div className="cm-title">{m.title}</div><div className="cm-val">{m.val}</div></div>
                </div>
              ))}
            </div>
          </div>

          {sent ? (
            <div className="contact-success">
              <div style={{fontSize:'3rem',marginBottom:16}}>🎉</div>
              <h3>Message Sent!</h3>
              <p>Thanks for reaching out. We'll get back to you within 24 hours.</p>
              <Btn variant="primary" size="md" onClick={()=>{setSent(false);setForm({name:'',email:'',subject:'',message:''})}}>Send Another</Btn>
            </div>
          ) : (
            <form onSubmit={submit} className="contact-form">
              <h3>Send a Message</h3>
              <div className="form-row-2">
                <Input label="Your Name" value={form.name} onChange={e=>set('name',e.target.value)} required placeholder="Priya Sharma" />
                <Input label="Email Address" type="email" value={form.email} onChange={e=>set('email',e.target.value)} required placeholder="you@example.com" />
              </div>
              <Input label="Subject" value={form.subject} onChange={e=>set('subject',e.target.value)} required placeholder="How can we help?" />
              <Textarea label="Message" value={form.message} onChange={e=>set('message',e.target.value)} required placeholder="Describe your question or issue..." />
              <Btn type="submit" variant="primary" size="lg" className="btn-full" loading={sending}>Send Message →</Btn>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
