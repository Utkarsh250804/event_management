import React from 'react'
import { Link } from 'react-router-dom'
import './Footer.css'

export default function Footer() {
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-grid">
          <div className="footer-brand">
            <div className="footer-logo">Event<span>Flow</span></div>
            <p>Your gateway to experiences worth making time for. Discover, book, and manage events — all in one place.</p>
            <div className="footer-socials">
              <a href="#">TW</a><a href="#">IG</a><a href="#">LI</a>
            </div>
          </div>
          <div className="footer-col">
            <h4>Platform</h4>
            <Link to="/events">Browse Events</Link>
            <Link to="/organizer-info">For Organizers</Link>
            <Link to="/register">Sign Up Free</Link>
            <Link to="/login">Log In</Link>
          </div>
          <div className="footer-col">
            <h4>Support</h4>
            <a href="#">Help Center</a>
            <Link to="/contact">Contact Us</Link>
            <a href="#">Refund Policy</a>
            <a href="#">FAQs</a>
          </div>
          <div className="footer-col">
            <h4>Legal</h4>
            <a href="#">Privacy Policy</a>
            <a href="#">Terms of Service</a>
            <a href="#">Cookie Policy</a>
          </div>
        </div>
        <div className="footer-bottom">
          <p>© {new Date().getFullYear()} EventFlow. Built as an industry project — TCS.</p>
          <p>Backend: FastAPI · Frontend: React + Vite</p>
        </div>
      </div>
    </footer>
  )
}
