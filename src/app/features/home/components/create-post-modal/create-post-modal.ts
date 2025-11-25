import { Component, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-create-post-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './create-post-modal.html',
  styleUrl: './create-post-modal.css'
})
export class CreatePostModalComponent {
  @Output() closeModal = new EventEmitter<void>();
  @Output() publishPost = new EventEmitter<{content: string, imageUrl?: string}>();
  
  isOpen = false;
  postContent = '';
  isEditMode = false;
  originalContent = '';
  selectedImageUrl: string | null = null;

  open(content?: string): void {
    this.isOpen = true;
    if (content) {
      this.postContent = content;
      this.originalContent = content;
      this.isEditMode = true;
    } else {
      this.postContent = '';
      this.originalContent = '';
      this.isEditMode = false;
    }
    this.selectedImageUrl = null;
    document.body.style.overflow = 'hidden';
  }

  close(): void {
    this.isOpen = false;
    this.postContent = '';
    this.originalContent = '';
    this.isEditMode = false;
    this.selectedImageUrl = null;
    document.body.style.overflow = '';
    this.closeModal.emit();
  }

  onPublish(): void {
    if (this.postContent.trim()) {
      this.publishPost.emit({
        content: this.postContent.trim(),
        imageUrl: this.selectedImageUrl || undefined
      });
      this.close();
    }
  }

  onContentChange(): void {
    // Se llama cada vez que el usuario escribe
  }

  onFileSelected(event: any): void {
    const file = event.target.files[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.selectedImageUrl = e.target.result;
      };
      reader.readAsDataURL(file);
    }
    // Limpiar el input para poder seleccionar la misma imagen otra vez
    event.target.value = '';
  }

  removeImage(): void {
    this.selectedImageUrl = null;
  }

  get isPublishDisabled(): boolean {
    if (!this.isEditMode) {
      return this.postContent.trim().length === 0;
    } else {
      // Modo editar: deshabilitar si no hay cambios o está vacío
      const contentChanged = this.postContent.trim() !== this.originalContent.trim();
      const imageAdded = this.selectedImageUrl !== null;
      
      return this.postContent.trim().length === 0 || 
            (!contentChanged && !imageAdded);
    }
  }

  get modalTitle(): string {
    return this.isEditMode ? 'Editar publicación' : 'Crear publicación';
  }

  get publishButtonText(): string {
    return this.isEditMode ? 'Actualizar' : 'Publicar';
  }
}