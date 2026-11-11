using System;
using System.IO;
using System.IO.Compression;
using System.Reflection;
using System.Diagnostics;
using System.Threading;
using System.Threading.Tasks;
using System.Windows.Forms;
[assembly: AssemblyTitle("GUILDSAFIO 2 Launcher")]
[assembly: AssemblyVersion("0.11.0.0")]
class Bootstrap {
  [STAThread] static void Main(string[] args) {
    Application.EnableVisualStyles();
    string version = "v11-github-BUILD_ID";
    string parent = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData), "Guildsafio2Launcher", "launcher");
    string target = Path.Combine(parent, version);
    string executable = Path.Combine(target, "GUILDSAFIO 2 LAUNCHER.exe");
    bool test = args.Length == 2 && args[0] == "--extract-only";
    if (test) { target = Path.GetFullPath(args[1]); executable = Path.Combine(target, "GUILDSAFIO 2 LAUNCHER.exe"); }
    bool acquired;
    using (var mutex = new Mutex(true, "Local\\Guildsafio2InstallerV11", out acquired)) {
      if (!acquired) { MessageBox.Show("Ya se está preparando el launcher.", "Guildsafio 2"); return; }
      try {
        if (!File.Exists(Path.Combine(target, ".ready"))) {
          Directory.CreateDirectory(test ? Path.GetDirectoryName(target) : parent);
          string staging = target + ".install-" + Guid.NewGuid().ToString("N");
          var form = new Form { Text = "Instalando GUILDSAFIO 2", Width = 470, Height = 155, StartPosition = FormStartPosition.CenterScreen, FormBorderStyle = FormBorderStyle.FixedDialog, MaximizeBox = false, MinimizeBox = false, ControlBox = false };
          var label = new Label { Text = "Preparando el launcher. Espera un momento…", Left = 20, Top = 20, Width = 420 };
          var bar = new ProgressBar { Left = 20, Top = 55, Width = 410, Style = ProgressBarStyle.Marquee };
          form.Controls.Add(label); form.Controls.Add(bar);
          Exception failure = null;
          form.Shown += async delegate {
            await Task.Run(() => {
              try {
                Directory.CreateDirectory(staging);
                using (Stream payload = Assembly.GetExecutingAssembly().GetManifestResourceStream("payload.zip"))
                using (var archive = new ZipArchive(payload, ZipArchiveMode.Read)) {
                  foreach (var entry in archive.Entries) {
                    string output = Path.GetFullPath(Path.Combine(staging, entry.FullName));
                    if (!output.StartsWith(Path.GetFullPath(staging) + Path.DirectorySeparatorChar, StringComparison.OrdinalIgnoreCase)) throw new Exception("Ruta de instalación inválida.");
                    if (entry.Name.Length == 0) { Directory.CreateDirectory(output); continue; }
                    Directory.CreateDirectory(Path.GetDirectoryName(output));
                    entry.ExtractToFile(output, false);
                  }
                }
                File.WriteAllText(Path.Combine(staging, ".ready"), version);
                if (Directory.Exists(target)) Directory.Move(target, target + ".backup-" + Guid.NewGuid().ToString("N"));
                Directory.Move(staging, target);
              } catch (Exception e) { failure = e; }
            });
            form.Close();
          };
          Application.Run(form);
          if (failure != null) throw failure;
        }
        if (test) return;
        try {
          Type shellType = Type.GetTypeFromProgID("WScript.Shell");
          dynamic shell = Activator.CreateInstance(shellType);
          string shortcutPath = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.DesktopDirectory), "GUILDSAFIO 2.lnk");
          dynamic shortcut = shell.CreateShortcut(shortcutPath);
          shortcut.TargetPath = executable; shortcut.WorkingDirectory = target; shortcut.IconLocation = executable + ",0"; shortcut.Save();
        } catch { }
        Process.Start(new ProcessStartInfo(executable) { WorkingDirectory = target, UseShellExecute = true });
      } catch (Exception e) { Environment.ExitCode = 1; MessageBox.Show("No se pudo preparar el launcher: " + e.Message, "Guildsafio 2", MessageBoxButtons.OK, MessageBoxIcon.Error); }
    }
  }
}
