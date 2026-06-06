import SwiftUI
import FirebaseCore // Importante!

@main
struct iOSApp: App {
    
    // Inicializador do App para configurar o Firebase antes de qualquer outra coisa
    init() {
        FirebaseApp.configure()
    }
    
    var body: some Scene {
        WindowGroup {
            ContentView()
        }
    }
}
