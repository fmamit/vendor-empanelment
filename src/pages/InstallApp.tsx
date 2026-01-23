import { MobileLayout } from "@/components/layout/MobileLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Share, 
  PlusSquare, 
  MoreVertical, 
  Smartphone,
  CheckCircle2
} from "lucide-react";

export default function InstallApp() {
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
  const isAndroid = /Android/.test(navigator.userAgent);

  return (
    <MobileLayout title="Install App">
      <div className="flex-1 p-6 space-y-6">
        <div className="text-center">
          <div className="h-20 w-20 rounded-2xl bg-primary mx-auto flex items-center justify-center mb-4">
            <Smartphone className="h-10 w-10 text-primary-foreground" />
          </div>
          <h1 className="text-2xl font-bold">Install Capital India Vendor Portal</h1>
          <p className="text-muted-foreground mt-2">
            Add this app to your home screen for quick access
          </p>
        </div>

        {/* Benefits */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Why install?</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {[
              "Works offline - fill forms anytime",
              "Push notifications for updates",
              "Faster loading & native feel",
              "No app store download needed",
            ].map((benefit, index) => (
              <div key={index} className="flex items-center gap-3">
                <CheckCircle2 className="h-5 w-5 text-success shrink-0" />
                <span className="text-sm">{benefit}</span>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* iOS Instructions */}
        {(isIOS || !isAndroid) && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <span className="text-xl">🍎</span> iPhone / iPad
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="h-8 w-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold shrink-0">
                  1
                </div>
                <div className="flex-1">
                  <p className="font-medium">Tap the Share button</p>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                    <Share className="h-4 w-4" />
                    <span>at the bottom of Safari</span>
                  </div>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="h-8 w-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold shrink-0">
                  2
                </div>
                <div className="flex-1">
                  <p className="font-medium">Tap "Add to Home Screen"</p>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                    <PlusSquare className="h-4 w-4" />
                    <span>in the share menu</span>
                  </div>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="h-8 w-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold shrink-0">
                  3
                </div>
                <div className="flex-1">
                  <p className="font-medium">Tap "Add"</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    The app icon will appear on your home screen
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Android Instructions */}
        {(isAndroid || !isIOS) && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <span className="text-xl">🤖</span> Android
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="h-8 w-8 rounded-full bg-accent text-accent-foreground flex items-center justify-center text-sm font-bold shrink-0">
                  1
                </div>
                <div className="flex-1">
                  <p className="font-medium">Tap the menu button</p>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                    <MoreVertical className="h-4 w-4" />
                    <span>three dots in Chrome</span>
                  </div>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="h-8 w-8 rounded-full bg-accent text-accent-foreground flex items-center justify-center text-sm font-bold shrink-0">
                  2
                </div>
                <div className="flex-1">
                  <p className="font-medium">Tap "Install app" or "Add to Home screen"</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    in the dropdown menu
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="h-8 w-8 rounded-full bg-accent text-accent-foreground flex items-center justify-center text-sm font-bold shrink-0">
                  3
                </div>
                <div className="flex-1">
                  <p className="font-medium">Tap "Install"</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    The app will be added to your app drawer
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </MobileLayout>
  );
}
