import AppRouter from './routes/AppRouter';
import SelectEnhancer from './components/common/SelectEnhancer';
import DocumentMeta from './components/common/DocumentMeta';
import GlobalLoadingIndicator from './components/common/GlobalLoadingIndicator';

function App() {
  return (
    <>
      <DocumentMeta />
      <AppRouter />
      <SelectEnhancer />
      <GlobalLoadingIndicator />
    </>
  );
}

export default App;
