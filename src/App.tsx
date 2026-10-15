import React, { useState } from 'react';
import { DocumentItem } from './types/classifier';
import { SAMPLE_DOCUMENTS } from './data/mockCorpus';
import { Navbar } from './components/Navbar';
import { StatsBar } from './components/StatsBar';
import { DriveWorkspaceView } from './components/DriveWorkspaceView';
import { DeepInspectorView } from './components/DeepInspectorView';
import { RealityIsolationAuditView } from './components/RealityIsolationAuditView';
import { TaxonomyReferenceView } from './components/TaxonomyReferenceView';
import { DocumentDetailModal } from './components/DocumentDetailModal';
import { NewDocModal } from './components/NewDocModal';

export default function App() {
  const [activeTab, setActiveTab] = useState<'workspace' | 'inspector' | 'audit' | 'taxonomy'>('workspace');
  const [documents, setDocuments] = useState<DocumentItem[]>(SAMPLE_DOCUMENTS);
  const [selectedDocument, setSelectedDocument] = useState<DocumentItem | null>(null);
  const [isNewDocModalOpen, setIsNewDocModalOpen] = useState(false);
  const [isClassifyingSingle, setIsClassifyingSingle] = useState(false);
  const [isBatchClassifying, setIsBatchClassifying] = useState(false);
  const [batchProgress, setBatchProgress] = useState({ current: 0, total: 0 });
  const [dispatched, setDispatched] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);

  const showNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 4000);
  };

  // Classify a single document
  const handleClassifySingle = async (doc: DocumentItem) => {
    setIsClassifyingSingle(true);

    try {
      const response = await fetch('/api/classify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: doc.title,
          snippet: doc.snippet,
          fullText: doc.fullText,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error ${response.status}`);
      }

      const classification = await response.json();

      const updatedDoc: DocumentItem = {
        ...doc,
        classification,
        status: 'classified',
        targetFolder: `/Drive/${classification.category.replace(/[/\\?%*:|"<>]/g, '-')}`,
      };

      setDocuments((prev) => prev.map((d) => (d.id === doc.id ? updatedDoc : d)));
      if (selectedDocument?.id === doc.id) {
        setSelectedDocument(updatedDoc);
      }

      if (classification.reality_isolation_triggered) {
        showNotification(
          `Protected "${doc.title}": Reality Isolation active - enforced Personal domain.`
        );
      } else {
        showNotification(`Classified "${doc.title}" into ${classification.category}.`);
      }
    } catch (err: any) {
      console.error('Classification error:', err);
      showNotification(`Failed to classify document: ${err?.message || 'Server error'}`);
    } finally {
      setIsClassifyingSingle(false);
    }
  };

  // Batch classify pending documents
  const handleClassifyBatch = async () => {
    const pendingDocs = documents.filter((d) => d.status === 'pending');
    if (pendingDocs.length === 0) return;

    setIsBatchClassifying(true);
    setBatchProgress({ current: 0, total: pendingDocs.length });

    try {
      // Send batch to server
      const response = await fetch('/api/classify-batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ documents: pendingDocs }),
      });

      if (!response.ok) {
        throw new Error(`Batch request failed with status ${response.status}`);
      }

      const data = await response.json();
      const resultsMap = new Map<string, any>();
      (data.results || []).forEach((r: any) => {
        resultsMap.set(r.id, r);
      });

      setDocuments((prev) =>
        prev.map((d) => {
          const res = resultsMap.get(d.id);
          if (res) {
            return {
              ...d,
              status: 'classified',
              classification: res.classification,
              targetFolder: res.targetFolder,
            };
          }
          return d;
        })
      );

      setBatchProgress({ current: pendingDocs.length, total: pendingDocs.length });
      showNotification(
        `Batch classification complete: ${pendingDocs.length} documents processed with Gemini 3.8 Flash.`
      );
    } catch (err: any) {
      console.error('Batch classification error:', err);
      showNotification(`Batch error: ${err?.message || 'Classification failed'}`);
    } finally {
      setIsBatchClassifying(false);
    }
  };

  // Add document from modal
  const handleAddDocument = (newDoc: DocumentItem, runImmediate = false) => {
    setDocuments((prev) => [newDoc, ...prev]);
    if (runImmediate) {
      handleClassifySingle(newDoc);
    } else {
      showNotification(`Added "${newDoc.title}" to Google Drive queue.`);
    }
  };

  // Reset corpus to original samples
  const handleResetCorpus = () => {
    setDocuments(SAMPLE_DOCUMENTS);
    setDispatched(false);
    showNotification('Workspace reset to standard enterprise corpus.');
  };

  // Organize classified files into Google Drive folders
  const handleDispatchDrive = () => {
    setDispatched(true);
    showNotification('Google Drive Workspace sync executed: files organized into domain directories.');
  };

  const realityIsolationCount = documents.filter(
    (d) => d.classification?.reality_isolation_triggered || d.classification?.category === 'Personal'
  ).length;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans flex flex-col">
      {/* Toast Notification Banner */}
      {notification && (
        <div className="fixed bottom-6 right-6 z-50 bg-indigo-950/95 border border-indigo-700/80 text-indigo-200 px-4 py-3 rounded-xl shadow-2xl text-xs font-medium flex items-center gap-2 animate-bounce">
          <span className="w-2 h-2 rounded-full bg-indigo-400 animate-ping"></span>
          <span>{notification}</span>
        </div>
      )}

      {/* Navigation Bar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        realityIsolationCount={realityIsolationCount}
        totalDocs={documents.length}
        classifiedCount={documents.filter((d) => d.status === 'classified').length}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Global Key Stats */}
        <StatsBar documents={documents} dispatched={dispatched} />

        {/* Tab Views */}
        {activeTab === 'workspace' && (
          <DriveWorkspaceView
            documents={documents}
            onSelectDocument={setSelectedDocument}
            onClassifySingle={handleClassifySingle}
            onClassifyBatch={handleClassifyBatch}
            onOpenNewDocModal={() => setIsNewDocModalOpen(true)}
            onResetCorpus={handleResetCorpus}
            onDispatchDrive={handleDispatchDrive}
            isBatchClassifying={isBatchClassifying}
            batchProgress={batchProgress}
            dispatched={dispatched}
          />
        )}

        {activeTab === 'inspector' && <DeepInspectorView />}

        {activeTab === 'audit' && (
          <RealityIsolationAuditView
            documents={documents}
            onSelectDocument={setSelectedDocument}
          />
        )}

        {activeTab === 'taxonomy' && <TaxonomyReferenceView />}
      </main>

      {/* Modals */}
      <DocumentDetailModal
        document={selectedDocument}
        onClose={() => setSelectedDocument(null)}
        onClassifySingle={handleClassifySingle}
        isClassifying={isClassifyingSingle}
      />

      <NewDocModal
        isOpen={isNewDocModalOpen}
        onClose={() => setIsNewDocModalOpen(false)}
        onAddDocument={handleAddDocument}
      />

      {/* Subtle Footer */}
      <footer className="border-t border-slate-900 bg-slate-950/80 py-4 text-center text-xs text-slate-500">
        Autonomous Document Classifier & Workspace Organizer • 9-Domain Governance with Reality Isolation Precedence
      </footer>
    </div>
  );
}
