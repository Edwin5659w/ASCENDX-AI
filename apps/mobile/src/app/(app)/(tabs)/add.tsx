import { Redirect } from 'expo-router';

/** Ruta del botón central (+). El botón abre /new-movement; si se llega aquí, se redirige. */
export default function AddTab() {
  return <Redirect href="/new-movement" />;
}
