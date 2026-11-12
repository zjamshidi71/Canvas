// ---------------------------------------------------------------------------
// Phone features (camera, notifications) for the Canvas mobile app.
//
// Teaching note:
//   The same website runs in two places:
//     1. A normal browser (desktop or mobile Safari/Chrome)
//     2. Inside the Capacitor app on Android/iOS
//   Only #2 can use native features. Every helper here first checks
//   isNativeApp() and quietly does nothing (or returns null) in a browser,
//   so components can call them without worrying about where they run.
//
//   The plugins are imported with `await import(...)` inside each function,
//   so their code is only downloaded when a phone feature is actually used.
// ---------------------------------------------------------------------------

import { Capacitor } from "@capacitor/core";

/** True only when running inside the Android/iOS app, never in a browser. */
export function isNativeApp(): boolean {
  return Capacitor.isNativePlatform();
}

// ---- Camera ---------------------------------------------------------------

export type PhotoSource = "camera" | "gallery";

/**
 * Opens the phone camera or photo gallery and returns the picked image as a
 * normal `File`. Callers can then upload it exactly like a file chosen with
 * <input type="file">.
 *
 * Returns null if the user cancels or if not running in the app.
 */
export async function pickPhoto(source: PhotoSource): Promise<File | null> {
  if (!isNativeApp()) return null;

  const { Camera, MediaTypeSelection } = await import("@capacitor/camera");

  try {
    // Shrink big phone photos so they stay under our 5 MB upload limit.
    const photoOptions = { quality: 85, targetWidth: 2048, targetHeight: 2048 };

    const result =
      source === "camera"
        ? await Camera.takePhoto(photoOptions)
        : (
            await Camera.chooseFromGallery({
              mediaType: MediaTypeSelection.Photo,
              allowMultipleSelection: false,
            })
          ).results[0];

    if (!result?.uri) return null;

    // The camera gives us a file path on the phone. Read it with the
    // Filesystem plugin (as base64) and turn it into a browser File.
    const { Filesystem } = await import("@capacitor/filesystem");
    const { data } = await Filesystem.readFile({ path: result.uri });
    if (typeof data !== "string") return null;

    const bytes = Uint8Array.from(atob(data), (char) => char.charCodeAt(0));
    const isPng = result.uri.toLowerCase().endsWith(".png");
    const type = isPng ? "image/png" : "image/jpeg";
    return new File([bytes], `photo-${Date.now()}.${isPng ? "png" : "jpg"}`, { type });
  } catch (err) {
    // Closing the camera without taking a photo throws — that's not an error.
    const message = err instanceof Error ? err.message.toLowerCase() : "";
    if (message.includes("cancel")) return null;
    throw err;
  }
}

// ---- Notifications ----------------------------------------------------------

/**
 * Shows a notification on the phone right away (a "local" notification —
 * created by the app itself, no server needed).
 *
 * Asks for permission the first time. Does nothing in a browser or if the
 * user said no.
 */
export async function notify(title: string, body: string): Promise<void> {
  if (!isNativeApp()) return;

  const { LocalNotifications } = await import("@capacitor/local-notifications");

  let { display } = await LocalNotifications.checkPermissions();
  if (display === "prompt" || display === "prompt-with-rationale") {
    ({ display } = await LocalNotifications.requestPermissions());
  }
  if (display !== "granted") return;

  await LocalNotifications.schedule({
    notifications: [
      {
        // Notification ids must be 32-bit integers.
        id: Math.floor(Math.random() * 2_000_000_000),
        title,
        body,
      },
    ],
  });
}
