import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';
import { ContactHelpPage } from './ContactHelpPage';

const renderPage = () =>
  render(
    <MemoryRouter>
      <ContactHelpPage />
    </MemoryRouter>,
  );

describe('ContactHelpPage', () => {
  it('links back to the lot', () => {
    renderPage();

    expect(screen.getByRole('link', { name: /back to inventory lot/i })).toHaveAttribute('href', '/');
  });

  it('confirms an enquiry and lets the user send another', async () => {
    renderPage();

    await userEvent.type(screen.getByLabelText(/full name/i), 'Priya');
    await userEvent.type(screen.getByLabelText(/phone number/i), '9876543210');
    await userEvent.type(screen.getByLabelText(/detailed message/i), 'Test drive on Saturday?');
    await userEvent.click(screen.getByRole('button', { name: /send|submit/i }));

    expect(screen.getByRole('heading', { name: 'Enquiry Received!' })).toBeInTheDocument();
    expect(screen.getByText('Priya')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Send another inquiry' }));
    expect(screen.getByLabelText(/detailed message/i)).toHaveValue('');
  });
});
