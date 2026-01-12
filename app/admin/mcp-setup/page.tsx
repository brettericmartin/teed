import { Metadata } from 'next';
import { requireAdmin } from '@/lib/adminAuth';
import MCPSetupGuide from './MCPSetupGuide';

export const metadata: Metadata = {
  title: 'MCP Server Setup - Admin - Teed',
  description: 'Setup guide for the Teed MCP Server - enabling AI assistants to manage gear bags',
};

export default async function MCPSetupPage() {
  await requireAdmin();
  return <MCPSetupGuide />;
}
