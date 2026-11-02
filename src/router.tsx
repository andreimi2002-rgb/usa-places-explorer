import { createBrowserRouter } from 'react-router';
import { Layout } from './components/layout/Layout';
import { AboutPage } from './pages/About/AboutPage';
import { BrandDetailPage } from './pages/Brands/BrandDetailPage';
import { BrandsIndexPage } from './pages/Brands/BrandsIndexPage';
import { CollectionsIndexPage } from './pages/Collections/CollectionsIndexPage';
import { CategoryDetailPage } from './pages/Categories/CategoryDetailPage';
import { CollectionDetailPage } from './pages/Collections/CollectionDetailPage';
import { PlaceDetailPage } from './pages/Places/PlaceDetailPage';
import { TypeDetailPage } from './pages/Types/TypeDetailPage';
import { HomePage } from './pages/Home/HomePage';
import { MapPage } from './pages/Map/MapPage';
import { NotFoundPage } from './pages/NotFound/NotFoundPage';
import { SearchPage } from './pages/Search/SearchPage';
import { StateDetailPage } from './pages/States/StateDetailPage';
import { StatesIndexPage } from './pages/States/StatesIndexPage';
import { TypesIndexPage } from './pages/Types/TypesIndexPage';

export const router = createBrowserRouter([
  {
    element: <Layout />,
    children: [
      { index: true, element: <HomePage /> },
      { path: 'types', element: <TypesIndexPage /> },
      { path: 'types/:slug', element: <TypeDetailPage /> },
      { path: 'brands', element: <BrandsIndexPage /> },
      { path: 'brands/:slug', element: <BrandDetailPage /> },
      { path: 'places/:slug', element: <PlaceDetailPage /> },
      { path: 'states', element: <StatesIndexPage /> },
      { path: 'states/:slug', element: <StateDetailPage /> },
      { path: 'categories/:slug', element: <CategoryDetailPage /> },
      { path: 'collections', element: <CollectionsIndexPage /> },
      { path: 'collections/:slug', element: <CollectionDetailPage /> },
      { path: 'map', element: <MapPage /> },
      { path: 'search', element: <SearchPage /> },
      { path: 'about', element: <AboutPage /> },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
]);
