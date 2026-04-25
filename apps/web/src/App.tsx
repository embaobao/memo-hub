import React from 'react';

const App = () => {
  return (
    <div style={{ 
      height: '100vh', 
      display: 'flex', 
      flexDirection: 'column',
      alignItems: 'center', 
      justifyContent: 'center',
      background: '#000',
      color: '#fff',
      fontFamily: 'system-ui'
    }}>
      <h1 style={{ fontSize: '3rem', margin: 0 }}>MemoHub V1</h1>
      <p style={{ opacity: 0.5 }}>Ether UI - Build Successful</p>
      <div style={{ marginTop: '2rem', display: 'flex', gap: '1rem' }}>
        <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#0070F3', boxShadow: '0 0 10px #0070F3' }}></div>
        <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#50E3C2', boxShadow: '0 0 10px #50E3C2' }}></div>
        <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#F5A623', boxShadow: '0 0 10px #F5A623' }}></div>
      </div>
      <div style={{ position: 'fixed', bottom: '2rem', fontSize: '0.8rem', opacity: 0.3 }}>
        [V1.0.0-PROD] Ready for memory orchestration.
      </div>
    </div>
  );
};

export default App;
