/**
 * Outline to task list plugin.
 *
 * A simple Obsidian plugin to convert a note's outline to a task list.
 */
import {
  Plugin,
  type Editor,
  type MarkdownView,
  type TFile,
  type TFolder,
} from "obsidian";
import { TaskList } from "src/taskList";

interface PluginSettings {
  maxNoteCreateTries: number;
}

const DEFAULT_SETTINGS: PluginSettings = {
  maxNoteCreateTries: 50,
};

export default class OutlineTaskListPlugin extends Plugin {
  /**
   * Plugin settings.
   */
  settings: PluginSettings;

  /**
   * Create an Obsidian note to store the resulting task list.
   */
  async createNote(
    originalName: string, folder: TFolder | null, makdownContent: string
  ): Promise<TFile> {
    const dirPath = folder === null ? "" : folder.path + "/";
    for (let index = 1; index < this.settings.maxNoteCreateTries; index++) {
      try {
        return await this.app.vault.create(
          dirPath +
          `${originalName} (task list${index === 1 ? "" : " " + index}).md`,
          makdownContent,
        );
      } catch (e) {
        // File already exists.
        continue; 
      }
    }
    throw Error("Maximum note creation retries exceeded.");
  }

  insertEditor(editor : Editor, view : MarkdownView) {
    const tasks = TaskList();
    tasks.parseOutline(editor.getValue());
    editor.replaceRange(tasks.toMarkdown(), editor.getCursor());
  }

  async insertNewNote(editor : Editor, view: MarkdownView) {
    const file = view.file;
      if (!file) {
        throw Error("Cannot find the current note.");
      }
    const tasks = TaskList();
    tasks.parseOutline(editor.getValue());
    await this.createNote(file.basename, file.parent, tasks.toMarkdown());
  }


  async onload(): Promise<void> {
    // Load settings.
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());

    // Add commands.
    this.addCommand({
      name: "Convert outline to a task list here.",
      id: "outline-task-list-insert",
      editorCallback: this.insertEditor,
    });
    this.addCommand({
      name: "Convert outline to a task list in a new note.",
      id: "outline-task-list-new-note",
      editorCallback: this.insertNewNote,
    });
  }
}
