import os
import hashlib
import math
import re
from collections import defaultdict
from flask import Flask, render_template, redirect, url_for, request, flash, jsonify
from flask_sqlalchemy import SQLAlchemy
from flask_login import LoginManager, UserMixin, login_user, login_required, logout_user, current_user
from werkzeug.security import generate_password_hash, check_password_hash
from werkzeug.utils import secure_filename
from sqlalchemy import func, desc
from datetime import datetime, timedelta

# --- CONFIGURATION ---
app = Flask(__name__)
app.config['SECRET_KEY'] = 'supersecretkey'
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///blog.db'
app.config['UPLOAD_FOLDER'] = 'static/uploads'
app.config['ALLOWED_EXTENSIONS'] = {'png', 'jpg', 'jpeg', 'gif'}

if not os.path.exists(app.config['UPLOAD_FOLDER']):
    os.makedirs(app.config['UPLOAD_FOLDER'])

db = SQLAlchemy(app)
login_manager = LoginManager()
login_manager.init_app(app)
login_manager.login_view = 'login'
app_start_time = datetime.utcnow()

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in app.config['ALLOWED_EXTENSIONS']

# --- DATABASE MODELS ---

bookmarks = db.Table('bookmarks',
    db.Column('user_id', db.Integer, db.ForeignKey('user.id')),
    db.Column('post_id', db.Integer, db.ForeignKey('blog_post.id'))
)

post_likes = db.Table('post_likes',
    db.Column('user_id', db.Integer, db.ForeignKey('user.id')),
    db.Column('post_id', db.Integer, db.ForeignKey('blog_post.id'))
)

comment_likes = db.Table('comment_likes',
    db.Column('user_id', db.Integer, db.ForeignKey('user.id')),
    db.Column('comment_id', db.Integer, db.ForeignKey('comment.id'))
)

# ✅ REPORT MODELS
class PostReport(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    reason = db.Column(db.String(100), nullable=False)
    timestamp = db.Column(db.DateTime, default=datetime.utcnow)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    post_id = db.Column(db.Integer, db.ForeignKey('blog_post.id'), nullable=False)

class CommentReport(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    reason = db.Column(db.String(100), nullable=False)
    timestamp = db.Column(db.DateTime, default=datetime.utcnow)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    comment_id = db.Column(db.Integer, db.ForeignKey('comment.id'), nullable=False)

class User(UserMixin, db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(150), unique=True, nullable=False)
    password = db.Column(db.String(150), nullable=False)
    role = db.Column(db.String(50), default='user') 
    is_writer_applicant = db.Column(db.Boolean, default=False)
    is_suspended = db.Column(db.Boolean, default=False)

    name = db.Column(db.String(150), nullable=True)
    bio = db.Column(db.Text, nullable=True)
    hobbies = db.Column(db.String(200), nullable=True)
    profile_pic = db.Column(db.String(150), default='default.jpg')

    bookmarked_posts = db.relationship('BlogPost', secondary=bookmarks, backref='bookmarked_by', lazy='dynamic')
    liked_posts = db.relationship('BlogPost', secondary=post_likes, backref='liked_by', lazy='dynamic')
    liked_comments = db.relationship('Comment', secondary=comment_likes, backref='liked_by', lazy='dynamic')

class BlogPost(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(200), nullable=False)
    excerpt = db.Column(db.String(500), nullable=False)
    content = db.Column(db.Text, nullable=False)
    thumbnail = db.Column(db.String(150), nullable=True)
    trending_thumbnail = db.Column(db.String(150), nullable=True)
    category = db.Column(db.String(50), nullable=False)
    tags = db.Column(db.String(200), nullable=True)
    status = db.Column(db.String(20), default='draft')
    date_posted = db.Column(db.DateTime, default=datetime.utcnow)
    author_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    author = db.relationship('User', backref=db.backref('posts', lazy=True))

    # Reports relation
    comments = db.relationship('Comment', backref='post', cascade="all, delete", lazy=True)
    reports = db.relationship('PostReport', backref='post', cascade="all, delete", lazy=True)

class Comment(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    content = db.Column(db.Text, nullable=False)
    date_posted = db.Column(db.DateTime, default=datetime.utcnow)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    author = db.relationship('User', backref='comments')
    post_id = db.Column(db.Integer, db.ForeignKey('blog_post.id'), nullable=False)

    # Reports relation
    reports = db.relationship('CommentReport', backref='comment', cascade="all, delete", lazy=True)

class PageView(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    path = db.Column(db.String(200), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=True)
    visitor_id = db.Column(db.String(64), nullable=False)

class ErrorLog(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    path = db.Column(db.String(200), nullable=False)
    message = db.Column(db.String(300), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)

@login_manager.user_loader
def load_user(user_id):
    return User.query.get(int(user_id))

@app.context_processor
def inject_layout():
    if request.endpoint == 'post_detail': return dict(layout='base_post.html')
    if request.endpoint in ['index', 'public_profile', 'all_posts']: return dict(layout='base_user.html')
    if not current_user.is_authenticated: return dict(layout='base_user.html')
    if current_user.role == 'writer': return dict(layout='base_writer.html')
    elif current_user.role == 'admin': return dict(layout='base_admin.html')
    else: return dict(layout='base_user.html')

def _should_track_view():
    if request.method != 'GET':
        return False
    if request.path.startswith('/static'):
        return False
    if request.path.startswith('/admin'):
        return False
    if request.path.startswith('/api'):
        return False
    return True

def _build_visitor_id():
    if current_user.is_authenticated:
        return f'user-{current_user.id}'
    raw = f"{request.remote_addr}-{request.headers.get('User-Agent', '')}"
    return hashlib.sha256(raw.encode('utf-8')).hexdigest()

def estimate_reading_time(content, words_per_minute=200):
    if not content:
        return 1
    text = re.sub(r'<[^>]+>', ' ', content)
    words = re.findall(r'\b\w+\b', text)
    minutes = math.ceil(len(words) / words_per_minute)
    return max(1, minutes)

@app.before_request
def track_page_view():
    if not _should_track_view():
        return
    try:
        view = PageView(
            path=request.path,
            user_id=current_user.id if current_user.is_authenticated else None,
            visitor_id=_build_visitor_id()
        )
        db.session.add(view)
        db.session.commit()
    except Exception:
        db.session.rollback()

@app.teardown_request
def log_server_error(exception=None):
    if exception is None:
        return
    try:
        error = ErrorLog(path=request.path, message=str(exception)[:300])
        db.session.add(error)
        db.session.commit()
    except Exception:
        db.session.rollback()

# --- API ROUTES ---
@app.route('/api/search')
def search_api():
    query = request.args.get('q', '')
    if len(query) < 2: return jsonify([])
    posts = BlogPost.query.filter(BlogPost.status == 'active', (BlogPost.title.ilike(f'%{query}%') | BlogPost.tags.ilike(f'%{query}%'))).limit(5).all()
    return jsonify([{'id': p.id, 'title': p.title, 'thumbnail': p.thumbnail or 'default.jpg', 'category': p.category} for p in posts])

@app.route('/api/bookmark/<int:post_id>', methods=['POST'])
@login_required
def toggle_bookmark(post_id):
    post = BlogPost.query.get_or_404(post_id)
    if post in current_user.bookmarked_posts:
        current_user.bookmarked_posts.remove(post)
        status = 'removed'
    else:
        current_user.bookmarked_posts.append(post)
        status = 'added'
    db.session.commit()
    return jsonify({'status': status})

@app.route('/api/like-post/<int:post_id>', methods=['POST'])
@login_required
def toggle_post_like(post_id):
    post = BlogPost.query.get_or_404(post_id)
    if post in current_user.liked_posts:
        current_user.liked_posts.remove(post)
        status = 'removed'
    else:
        current_user.liked_posts.append(post)
        status = 'added'
    db.session.commit()
    return jsonify({'status': status, 'count': post.liked_by.count()})

@app.route('/api/like-comment/<int:comment_id>', methods=['POST'])
@login_required
def toggle_comment_like(comment_id):
    comment = Comment.query.get_or_404(comment_id)
    if comment in current_user.liked_comments:
        current_user.liked_comments.remove(comment)
        status = 'removed'
    else:
        current_user.liked_comments.append(comment)
        status = 'added'
    db.session.commit()
    return jsonify({'status': status, 'count': comment.liked_by.count()})

# --- ✅ REPORT SUBMISSION ROUTES ---

@app.route('/report/post/<int:post_id>', methods=['POST'])
@login_required
def report_post(post_id):
    reason = request.form.get('reason')
    # Prevent duplicate reports by same user
    existing = PostReport.query.filter_by(user_id=current_user.id, post_id=post_id).first()
    if not existing:
        new_report = PostReport(reason=reason, user_id=current_user.id, post_id=post_id)
        db.session.add(new_report)
        db.session.commit()
        flash('Report submitted. Admins will review it.', 'warning')
    else:
        flash('You have already reported this post.', 'info')
    return redirect(url_for('post_detail', post_id=post_id))

@app.route('/report/comment/<int:comment_id>', methods=['POST'])
@login_required
def report_comment(comment_id):
    reason = request.form.get('reason')
    comment = Comment.query.get_or_404(comment_id)
    # Prevent duplicate
    existing = CommentReport.query.filter_by(user_id=current_user.id, comment_id=comment_id).first()
    if not existing:
        new_report = CommentReport(reason=reason, user_id=current_user.id, comment_id=comment_id)
        db.session.add(new_report)
        db.session.commit()
        flash('Comment reported.', 'warning')
    else:
        flash('Already reported.', 'info')
    return redirect(url_for('post_detail', post_id=comment.post_id))

# --- PUBLIC ROUTES ---
@app.route('/')
def index():
    trending = BlogPost.query.filter(BlogPost.status=='active', BlogPost.trending_thumbnail != None).order_by(BlogPost.date_posted.desc()).limit(5).all()
    latest = BlogPost.query.filter_by(status='active').order_by(BlogPost.date_posted.desc()).limit(6).all()
    distinct_cats = db.session.query(BlogPost.category).filter_by(status='active').distinct().limit(2).all()
    category_data = []
    for cat_tuple in distinct_cats:
        cat_name = cat_tuple[0]
        cat_posts = BlogPost.query.filter_by(status='active', category=cat_name).order_by(BlogPost.date_posted.desc()).limit(3).all()
        category_data.append({'name': cat_name, 'posts': cat_posts})
    top_writers = User.query.filter_by(role='writer').limit(5).all()
    latest_reading_times = {post.id: estimate_reading_time(post.content) for post in latest}
    return render_template('index.html', trending=trending, latest=latest, category_data=category_data, top_writers=top_writers, latest_reading_times=latest_reading_times)

@app.route('/all-posts')
def all_posts():
    page = request.args.get('page', 1, type=int)
    pagination = BlogPost.query.filter_by(status='active').order_by(BlogPost.date_posted.desc()).paginate(page=page, per_page=20, error_out=False)
    reading_times = {post.id: estimate_reading_time(post.content) for post in pagination.items}
    return render_template('all_posts.html', pagination=pagination, reading_times=reading_times)

@app.route('/post/<int:post_id>')
def post_detail(post_id):
    post = BlogPost.query.get_or_404(post_id)
    if post.status != 'active':
        if not current_user.is_authenticated or (current_user.role != 'admin' and current_user.id != post.author_id):
            flash('This post is not available.', 'warning')
            return redirect(url_for('index'))
    reading_time_minutes = estimate_reading_time(post.content)
    return render_template('post_detail.html', post=post, reading_time_minutes=reading_time_minutes)

@app.route('/u/<username>')
def public_profile(username):
    user = User.query.filter_by(username=username).first_or_404()
    posts = []
    if user.role == 'writer':
        posts = BlogPost.query.filter_by(author_id=user.id, status='active').order_by(BlogPost.date_posted.desc()).all()
    return render_template('public_profile.html', user=user, posts=posts)

@app.route('/post/<int:post_id>/comment', methods=['POST'])
@login_required
def add_comment(post_id):
    if current_user.is_suspended:
        flash('Your account is suspended. You cannot comment.', 'danger')
        return redirect(url_for('post_detail', post_id=post_id))
    post = BlogPost.query.get_or_404(post_id)
    content = request.form.get('content')
    if content:
        comment = Comment(content=content, author=current_user, post=post)
        db.session.add(comment)
        db.session.commit()
        flash('Comment added!', 'success')
    return redirect(url_for('post_detail', post_id=post_id))

@app.route('/apply-writer')
@login_required
def apply_writer():
    if current_user.is_suspended:
        flash('Suspended accounts cannot apply.', 'danger')
        return redirect(url_for('user_profile'))
    if current_user.role == 'user':
        current_user.is_writer_applicant = True
        db.session.commit()
        flash('Request sent to Admin.', 'info')
    return redirect(url_for('user_profile'))

# --- AUTH ROUTES ---
@app.route('/signup', methods=['GET', 'POST'])
def signup():
    if request.method == 'POST':
        username = request.form.get('username')
        password = request.form.get('password')
        role = 'admin' if username.lower() == 'admin' else 'user'
        new_user = User(username=username, password=generate_password_hash(password, method='pbkdf2:sha256'), role=role)
        try:
            db.session.add(new_user)
            db.session.commit()
            flash('Account created! Please login.', 'success')
            return redirect(url_for('login'))
        except:
            flash('Username already exists.', 'danger')
    return render_template('signup.html')

@app.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        username = request.form.get('username')
        password = request.form.get('password')
        user = User.query.filter_by(username=username).first()
        if user and check_password_hash(user.password, password):
            login_user(user)
            if user.is_suspended: flash('Your account is suspended. Posting/Commenting is restricted.', 'warning')
            if user.role == 'admin': return redirect(url_for('dashboard_admin'))
            elif user.role == 'writer': return redirect(url_for('dashboard_writer'))
            else: return redirect(url_for('user_profile'))
        else:
            flash('Login failed.', 'danger')
    return render_template('login.html')

@app.route('/logout')
@login_required
def logout():
    logout_user()
    return redirect(url_for('index'))

@app.route('/profile', methods=['GET', 'POST'])
@login_required
def user_profile():
    if request.method == 'POST':
        current_user.name = request.form.get('name')
        current_user.bio = request.form.get('bio')
        current_user.hobbies = request.form.get('hobbies')
        if 'profile_pic' in request.files:
            file = request.files['profile_pic']
            if file and allowed_file(file.filename):
                filename = secure_filename(file.filename)
                file.save(os.path.join(app.config['UPLOAD_FOLDER'], filename))
                current_user.profile_pic = filename
        db.session.commit()
        flash('Profile Updated!', 'success')
    return render_template('profile.html')

# --- ADMIN ROUTES (General) ---
@app.route('/admin/dashboard')
@login_required
def dashboard_admin():
    if current_user.role != 'admin': return redirect(url_for('index'))
    return render_template('dashboard_admin.html', 
                           pending_posts=BlogPost.query.filter_by(status='pending').all(), 
                           writer_applicants=User.query.filter_by(is_writer_applicant=True, role='user').all())

@app.route('/admin/users')
@login_required
def admin_users():
    if current_user.role != 'admin': return redirect(url_for('index'))
    filter_type = request.args.get('filter', 'all')
    search_query = request.args.get('q', '')
    query = User.query
    if search_query: query = query.filter(User.username.ilike(f'%{search_query}%') | User.name.ilike(f'%{search_query}%'))
    if filter_type == 'suspended': query = query.filter_by(is_suspended=True)
    elif filter_type == 'pending': query = query.filter_by(is_writer_applicant=True)
    elif filter_type == 'active': query = query.filter_by(is_suspended=False)
    users = query.order_by(User.id.desc()).all()
    return render_template('admin_users.html', users=users, filter_type=filter_type, search_query=search_query)

@app.route('/admin/site-status')
@login_required
def admin_site_status():
    if current_user.role != 'admin': return redirect(url_for('index'))
    now = datetime.utcnow()
    last_24h = now - timedelta(hours=24)
    total_views = PageView.query.count()
    unique_visitors = db.session.query(PageView.visitor_id).distinct().count()
    published_posts = BlogPost.query.filter_by(status='active').count()
    total_post_likes = db.session.query(post_likes).count()
    engagement_rate = (total_post_likes / total_views * 100) if total_views else 0

    views_last_24h = PageView.query.filter(PageView.created_at >= last_24h).count()
    top_page_row = db.session.query(PageView.path, func.count(PageView.id).label('view_count'))\
        .filter(PageView.created_at >= last_24h)\
        .group_by(PageView.path).order_by(desc('view_count')).first()
    top_page = top_page_row.path if top_page_row else 'No traffic yet'

    recent_views = PageView.query.filter(PageView.created_at >= last_24h).all()
    visitor_times = defaultdict(list)
    for view in recent_views:
        visitor_times[view.visitor_id].append(view.created_at)
    session_durations = []
    bounce_visitors = 0
    for times in visitor_times.values():
        if len(times) == 1:
            bounce_visitors += 1
            continue
        session_durations.append((max(times) - min(times)).total_seconds())
    avg_time_seconds = int(sum(session_durations) / len(session_durations)) if session_durations else 0
    avg_minutes, avg_seconds = divmod(avg_time_seconds, 60)
    avg_hours, avg_minutes = divmod(avg_minutes, 60)
    if avg_hours:
        avg_time_display = f"{avg_hours}h {avg_minutes}m"
    elif avg_minutes:
        avg_time_display = f"{avg_minutes}m {avg_seconds}s"
    else:
        avg_time_display = f"{avg_seconds}s"
    bounce_rate = (bounce_visitors / len(visitor_times) * 100) if visitor_times else 0

    errors_today = ErrorLog.query.filter(ErrorLog.created_at >= now.replace(hour=0, minute=0, second=0, microsecond=0)).count()
    uptime_seconds = int((now - app_start_time).total_seconds())
    uptime_percent = 100.0

    return render_template(
        'admin_site_status.html',
        total_views=f"{total_views:,}",
        unique_visitors=f"{unique_visitors:,}",
        published_posts=f"{published_posts:,}",
        engagement_rate=f"{engagement_rate:.1f}%",
        views_last_24h=f"{views_last_24h:,}",
        top_page=top_page,
        avg_time_display=avg_time_display,
        bounce_rate=f"{bounce_rate:.1f}%",
        errors_today=f"{errors_today:,}",
        uptime_percent=f"{uptime_percent:.2f}%",
        uptime_seconds=uptime_seconds,
        last_update=now.strftime('%H:%M')
    )

# --- ✅ ADMIN REPORT ROUTES ---

@app.route('/admin/reports/posts')
@login_required
def admin_post_reports():
    if current_user.role != 'admin': return redirect(url_for('index'))
    # Query to count reports per post and order by count descending
    ranked_posts = db.session.query(BlogPost, func.count(PostReport.id).label('report_count'))\
        .join(PostReport).group_by(BlogPost.id).order_by(desc('report_count')).all()
    return render_template('admin_post_reports.html', items=ranked_posts)

@app.route('/admin/reports/comments')
@login_required
def admin_comment_reports():
    if current_user.role != 'admin': return redirect(url_for('index'))
    ranked_comments = db.session.query(Comment, func.count(CommentReport.id).label('report_count'))\
        .join(CommentReport).group_by(Comment.id).order_by(desc('report_count')).all()
    return render_template('admin_comment_reports.html', items=ranked_comments)

# --- REPORT ACTIONS ---

@app.route('/admin/action/delete_post/<int:id>')
@login_required
def delete_reported_post(id):
    if current_user.role == 'admin':
        post = BlogPost.query.get_or_404(id)
        db.session.delete(post)
        db.session.commit()
        flash('Post permanently deleted.', 'success')
    return redirect(url_for('admin_post_reports'))

@app.route('/admin/action/dismiss_post_reports/<int:id>')
@login_required
def dismiss_post_reports(id):
    if current_user.role == 'admin':
        # Delete all reports for this post, keep the post
        PostReport.query.filter_by(post_id=id).delete()
        db.session.commit()
        flash('Reports rejected (cleared). Post is safe.', 'info')
    return redirect(url_for('admin_post_reports'))

@app.route('/admin/action/delete_comment/<int:id>')
@login_required
def delete_reported_comment(id):
    if current_user.role == 'admin':
        comment = Comment.query.get_or_404(id)
        db.session.delete(comment)
        db.session.commit()
        flash('Comment deleted.', 'success')
    return redirect(url_for('admin_comment_reports'))

@app.route('/admin/action/dismiss_comment_reports/<int:id>')
@login_required
def dismiss_comment_reports(id):
    if current_user.role == 'admin':
        CommentReport.query.filter_by(comment_id=id).delete()
        db.session.commit()
        flash('Reports rejected (cleared). Comment is safe.', 'info')
    return redirect(url_for('admin_comment_reports'))

# --- USER ACTIONS (SUSPEND ETC) ---
@app.route('/admin/user/suspend/<int:user_id>')
@login_required
def suspend_user(user_id):
    if current_user.role == 'admin':
        user = User.query.get_or_404(user_id)
        if user.role != 'admin':
            user.is_suspended = True
            db.session.commit()
            flash(f'{user.username} suspended.', 'warning')
    return redirect(request.referrer)

@app.route('/admin/user/activate/<int:user_id>')
@login_required
def activate_user(user_id):
    if current_user.role == 'admin':
        user = User.query.get_or_404(user_id)
        user.is_suspended = False
        db.session.commit()
        flash(f'{user.username} active.', 'success')
    return redirect(request.referrer)

@app.route('/admin/user/make-writer/<int:user_id>')
@login_required
def make_writer(user_id):
    if current_user.role == 'admin':
        user = User.query.get_or_404(user_id)
        user.role = 'writer'
        user.is_writer_applicant = False
        db.session.commit()
        flash(f'{user.username} is now Writer.', 'success')
    return redirect(request.referrer)

@app.route('/admin/user/make-user/<int:user_id>')
@login_required
def make_user_role(user_id):
    if current_user.role == 'admin':
        user = User.query.get_or_404(user_id)
        if user.role != 'admin':
            user.role = 'user'
            db.session.commit()
    return redirect(request.referrer)

@app.route('/approve/<int:id>')
@login_required
def approve_post(id):
    if current_user.role == 'admin':
        BlogPost.query.get_or_404(id).status = 'active'
        db.session.commit()
    return redirect(url_for('dashboard_admin'))

@app.route('/reject/<int:id>')
@login_required
def reject_post(id):
    if current_user.role == 'admin':
        BlogPost.query.get_or_404(id).status = 'rejected'
        db.session.commit()
    return redirect(url_for('dashboard_admin'))

# --- WRITER/POST CRUD ---
@app.route('/writer/dashboard')
@login_required
def dashboard_writer():
    if current_user.role != 'writer': return redirect(url_for('index'))
    return render_template('dashboard_writer.html', active=BlogPost.query.filter_by(author_id=current_user.id, status='active').count(), pending=BlogPost.query.filter_by(author_id=current_user.id, status='pending').count(), draft=BlogPost.query.filter_by(author_id=current_user.id, status='draft').count(), rejected=BlogPost.query.filter_by(author_id=current_user.id, status='rejected').count())

@app.route('/writer/posts')
@login_required
def manage_posts():
    if current_user.role != 'writer': return redirect(url_for('index'))
    posts = BlogPost.query.filter_by(author_id=current_user.id).order_by(BlogPost.date_posted.desc()).all()
    return render_template('manage_posts.html', posts=posts)

@app.route('/create', methods=['GET', 'POST'])
@login_required
def create_post():
    if current_user.role != 'writer': return redirect(url_for('index'))
    if current_user.is_suspended:
        flash('Suspended. Cannot create post.', 'danger')
        return redirect(url_for('dashboard_writer'))
    if request.method == 'POST':
        title = request.form.get('title')
        content = request.form.get('content')
        excerpt = request.form.get('excerpt')
        category = request.form.get('category')
        tags = request.form.get('tags')
        status = 'pending' if request.form.get('action') == 'submit' else 'draft'
        thumb = request.files.get('thumbnail')
        trend = request.files.get('trending_thumbnail')
        thumb_file = secure_filename(thumb.filename) if thumb else None
        trend_file = secure_filename(trend.filename) if trend else None
        if thumb_file: thumb.save(os.path.join(app.config['UPLOAD_FOLDER'], thumb_file))
        if trend_file: trend.save(os.path.join(app.config['UPLOAD_FOLDER'], trend_file))
        post = BlogPost(title=title, excerpt=excerpt, content=content, category=category, tags=tags, thumbnail=thumb_file, trending_thumbnail=trend_file, author=current_user, status=status)
        db.session.add(post)
        db.session.commit()
        return redirect(url_for('manage_posts'))
    return render_template('create_post.html')

@app.route('/edit/<int:id>', methods=['GET', 'POST'])
@login_required
def edit_post(id):
    post = BlogPost.query.get_or_404(id)
    if post.author_id != current_user.id: return redirect(url_for('index'))
    if current_user.is_suspended:
        flash('Suspended. Cannot edit.', 'danger')
        return redirect(url_for('manage_posts'))
    if request.method == 'POST':
        post.title = request.form.get('title')
        post.content = request.form.get('content')
        post.excerpt = request.form.get('excerpt')
        post.category = request.form.get('category')
        post.tags = request.form.get('tags')
        if request.form.get('action') == 'submit': post.status = 'pending'
        elif request.form.get('action') == 'draft': post.status = 'draft'
        if 'thumbnail' in request.files:
            file = request.files['thumbnail']
            if file:
                filename = secure_filename(file.filename)
                file.save(os.path.join(app.config['UPLOAD_FOLDER'], filename))
                post.thumbnail = filename
        if 'trending_thumbnail' in request.files:
            file = request.files['trending_thumbnail']
            if file:
                filename = secure_filename(file.filename)
                file.save(os.path.join(app.config['UPLOAD_FOLDER'], filename))
                post.trending_thumbnail = filename
        db.session.commit()
        return redirect(url_for('manage_posts'))
    return render_template('edit_post.html', post=post)

@app.route('/delete/<int:id>')
@login_required
def delete_post(id):
    post = BlogPost.query.get_or_404(id)
    if current_user.role == 'admin' or current_user.id == post.author_id:
        db.session.delete(post)
        db.session.commit()
        flash('Post deleted.', 'success')
    return redirect(url_for('manage_posts') if current_user.role == 'writer' else url_for('dashboard_admin'))

if __name__ == '__main__':
    with app.app_context():
        db.create_all()
    app.run(host='0.0.0.0', port=8080)
