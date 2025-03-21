
import React from 'react';

interface AccountProps {
  session: any;
}

const Account: React.FC<AccountProps> = ({ session }) => {
  return (
    <div>
      <h1>Account Page</h1>
      <p>User ID: {session.user.id}</p>
    </div>
  );
};

export default Account;
