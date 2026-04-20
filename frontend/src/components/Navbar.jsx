import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard,
  Pill,
  CalendarClock,
  History,
  LogOut,
  Stethoscope,
} from 'lucide-react';

const NAV_ITEMS = [
  { to: '/dashboard',  icon: LayoutDashboard, label: 'Dashboard'  },
  { to: '/medicines',  icon: Pill,            label: 'Medicines'  },
  { to: '/schedule',   icon: CalendarClock,   label: 'Schedule'   },
  { to: '/history',    icon: History,         label: 'History'    },
];

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <aside className="app-sidebar">
      {/* Logo */}
      <div className="sidebar-logo">
        <div className="sidebar-logo-icon">
          <Stethoscope size={20} color="white" />
        </div>
        <span className="sidebar-logo-text">MedTrack</span>
      </div>

      {/* Nav */}
      <nav className="sidebar-nav">
        {NAV_ITEMS.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
          >
            <Icon size={18} />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>

      {/* Footer / user */}
      <div className="sidebar-footer">
        <div style={{ padding: '10px 14px 14px', fontSize: 13, color: 'var(--text-3)' }}>
          <div style={{ fontWeight: 700, color: 'var(--text-2)', fontSize: 14, marginBottom: 2 }}>
            {user?.name}
          </div>
          <div style={{ fontSize: 12, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {user?.email}
          </div>
        </div>
        <button className="btn btn-glass" style={{ width: '100%' }} onClick={handleLogout}>
          <LogOut size={15} />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
};

export default Navbar;
